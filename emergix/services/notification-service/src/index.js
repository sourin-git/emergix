import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import notifyRoutes from './routes/notify.routes.js';

dotenv.config({ path: '../../.env' });

// Environment flag definition ensuring fallback matches strictly on runtime execution
process.env.INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY || 'emergix_internal_secret';

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/emergix')
  .then(() => console.log('MongoDB Connected for Notification Handling'))
  .catch(err => console.error(err));

app.use('/notify', notifyRoutes);

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
    console.log(`Notification Service running securely on port ${PORT}`);
});
