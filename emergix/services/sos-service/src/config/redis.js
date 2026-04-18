import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

export const connectRedis = () => redisClient.connect();
