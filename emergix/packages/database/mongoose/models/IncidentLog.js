import mongoose from 'mongoose';

const incidentLogSchema = new mongoose.Schema({
  incident_id: { type: String, required: true, index: true },
  events: [{
    timestamp: { type: Date, default: Date.now },
    actor: { type: String },
    action: { type: String },
    note: { type: String }
  }]
}, { timestamps: true });

export const IncidentLog = mongoose.models.IncidentLog || mongoose.model('IncidentLog', incidentLogSchema);
