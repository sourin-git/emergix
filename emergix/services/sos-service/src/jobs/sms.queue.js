import Queue from 'bull';
import mongoose from 'mongoose';

export const smsQueue = new Queue('sms-queue', process.env.REDIS_URL || 'redis://localhost:6379');

smsQueue.process('sendSms', async (job) => {
  const { smsId, to, message } = job.data;
  
  try {
    // This logs locally but mimics an external SMS provider API logic
    console.log(`[SMS-WORKER] Dispatching SMS to ${to}: ${message}`);
    
    // Simulating API network call latency
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Update MongoDB status to Sent
    const SmsModel = mongoose.model('SmsQueue');
    await SmsModel.findByIdAndUpdate(smsId, { status: 'SENT' });
    
    return { success: true };
  } catch (err) {
    console.error(`[SMS-WORKER] Error dispatching SMS to ${to}`, err);
    
    const SmsModel = mongoose.model('SmsQueue');
    await SmsModel.findByIdAndUpdate(smsId, { 
      status: 'FAILED',
      $inc: { retry_count: 1 } 
    });
    
    throw err; // Re-throws to let Bull handle automatic retries
  }
});
