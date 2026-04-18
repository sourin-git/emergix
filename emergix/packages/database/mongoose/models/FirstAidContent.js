import mongoose from 'mongoose';

const firstAidContentSchema = new mongoose.Schema({
  type: { type: String, required: true },
  title: { type: String, required: true },
  steps: [{ type: String }],
  voice_audio_url: { type: String },
  language: { type: String },
  offline_available: { type: Boolean, default: false }
}, { timestamps: true });

// Prevent model overwrite in hot-reloading scenarios like Next.js
export const FirstAidContent = mongoose.models.FirstAidContent || mongoose.model('FirstAidContent', firstAidContentSchema);
