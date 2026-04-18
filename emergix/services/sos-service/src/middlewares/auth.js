import jwt from 'jsonwebtoken';
import { redisClient } from '../config/redis.js';

export const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    // Optional check: validate if token is blacklisted in Redis or matches active session
    // const activeSession = await redisClient.get(`session:${decoded.id}`);
    
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};
