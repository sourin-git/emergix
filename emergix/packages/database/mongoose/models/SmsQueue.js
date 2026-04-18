import mongoose from 'mongoose';

const smsQueueSchema = new mongoose.Schema({
  to_number: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'SENT', 'FAILED'], default: 'PENDING' },
  retry_count: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

export const SmsQueue = mongoose.models.SmsQueue || mongoose.model('SmsQueue', smsQueueSchema);
