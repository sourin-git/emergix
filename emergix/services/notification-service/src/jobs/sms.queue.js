import Queue from 'bull';
import mongoose from 'mongoose';
import { sendRawSMS } from '../services/twilio.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Establishes primary fallback loop for critical messaging queues
export const notifySmsQueue = new Queue('notify-sms-queue', process.env.REDIS_URL || 'redis://localhost:6379');

notifySmsQueue.process('dispatchSms', async (job) => {
  const { to, message, incident_id, mongoId } = job.data;
  
  try {
    await sendRawSMS(to, message);
    
    if (mongoId) {
        const SmsModel = mongoose.model('SmsQueue');
        await SmsModel.findByIdAndUpdate(mongoId, { status: 'SENT' });
    }

    await prisma.notificationLog.create({
      data: {
        type: 'SMS',
        recipient: to,
        content: message,
        status: 'SENT',
        incidentId: incident_id || null
      }
    });

  } catch (err) {
    console.error(`[Notify-SMS] Failed transmission sequence to ${to}`, err);
    if (mongoId) {
        const SmsModel = mongoose.model('SmsQueue');
        await SmsModel.findByIdAndUpdate(mongoId, { 
          status: 'FAILED',
          $inc: { retry_count: 1 } 
        });
    }
    
    await prisma.notificationLog.create({
      data: {
        type: 'SMS',
        recipient: to,
        content: message,
        status: 'FAILED',
        incidentId: incident_id || null
      }
    });
    
    throw err; // Signal Bull queue processing pipeline to perform exponential backoff retrying natively
  }
});
