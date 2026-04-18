import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { redisClient, pubClient, subClient, connectRedis } from './config/redis.js';
import trackRoutes from './routes/track.routes.js';
import { setupSockets } from './sockets/socket.handler.js';

dotenv.config({ path: '../../.env' });

const app = express();
app.use(cors());
app.use(express.json());

// Apply 100 req/min rate limit globally across this service
const limiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 100, 
  message: { error: 'Too many requests from this IP, please try again after a minute' },
  standardHeaders: true, 
  legacyHeaders: false, 
});
app.use('/api', limiter);

const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: { origin: '*' }
});

connectRedis().then(() => {
  console.log('Redis connected for Tracking Service');
  // Inject the Redis adapter for multi-node web-socket horizontal scaling
  io.adapter(createAdapter(pubClient, subClient));
  setupSockets(io);
}).catch(console.error);

app.use('/api/track', trackRoutes);

const PORT = process.env.PORT || 3002;
httpServer.listen(PORT, () => console.log(`Tracking Service running on port ${PORT}`));
