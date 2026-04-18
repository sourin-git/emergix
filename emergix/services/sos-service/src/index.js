import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectRedis } from './config/redis.js';
import sosRoutes from './routes/sos.routes.js';

dotenv.config({ path: '../../.env' }); // Load root monorepo .env

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: { origin: '*' }
});

// Setup Databases
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/emergix')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Error', err));

connectRedis().then(() => console.log('Redis Connected'));

// Sockets handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join_room', (room) => {
    socket.join(room); // User specific rooms e.g. "user_123"
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Routes module
app.use('/api/sos', sosRoutes);

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`SOS Service running on port ${PORT}`);
});
