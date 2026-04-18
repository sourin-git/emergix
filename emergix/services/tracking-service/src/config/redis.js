import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Main client for get/set functionality
export const redisClient = createClient({ url: REDIS_URL });

// dedicated Pub/Sub clients required for socket.io redis-adapter
export const pubClient = createClient({ url: REDIS_URL });
export const subClient = createClient({ url: REDIS_URL });

export const connectRedis = async () => {
  await Promise.all([
    redisClient.connect(),
    pubClient.connect(),
    subClient.connect()
  ]);
};
