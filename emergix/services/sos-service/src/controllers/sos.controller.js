import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { redisClient } from '../config/redis.js';
import { io } from '../index.js';
import { smsQueue } from '../jobs/sms.queue.js';
import { findNearestAmbulance, getVolunteersWithinRadius } from '../services/ambulance.service.js';
import mongoose from 'mongoose';

// Fallback Model Registration using user provided schema
const SmsModel = mongoose.models.SmsQueue || mongoose.model('SmsQueue', new mongoose.Schema({
  to_number: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'SENT', 'FAILED'], default: 'PENDING' },
  retry_count: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
}));

const prisma = new PrismaClient();

export const triggerSosSchema = z.object({
  user_id: z.string().uuid(),
  incident_type: z.enum(['ACCIDENT', 'CARDIAC', 'SNAKE_BITE', 'OTHER']),
  location: z.object({ lat: z.number(), lng: z.number() }),
  landmark_text: z.string().optional(),
  voice_input: z.boolean().optional(),
  sms_mode: z.boolean().optional()
});

export const triggerSOS = async (req, res) => {
  try {
    const { user_id, incident_type, location, landmark_text, voice_input, sms_mode } = req.body;
    
    // 1. Find nearest ambulance
    const nearestAmbulance = await findNearestAmbulance(location.lat, location.lng);
    let ambulance_id = nearestAmbulance?.id || null;
    let urgency = 'CRITICAL'; 

    // 2. Alert volunteers if no ambulance within 10km
    if (!ambulance_id) {
       const volunteers = await getVolunteersWithinRadius(location.lat, location.lng, 10);
       io.emit('volunteers:alert', { incident_type, location, volunteers });
    }

    // 3. PostgreSQL Save Incident
    const incident = await prisma.incident.create({
      data: {
        userId: user_id,
        ambulanceId: ambulance_id,
        type: incident_type,
        urgency: urgency,
        landmarkText: landmark_text,
        locationLat: location.lat,
        locationLng: location.lng,
        status: ambulance_id ? 'DISPATCHED' : 'PENDING',
        smsFallbackUsed: sms_mode || false,
        voiceInputUsed: voice_input || false,
      },
      include: {
        ambulance: { include: { driver: true } }
      }
    });

    // 4. Update Ambulance Status
    if (ambulance_id) {
       await prisma.ambulance.update({
         where: { id: ambulance_id },
         data: { status: 'DISPATCHED' }
       });
    }

    // 5. Build queue logic for SMS
    if (sms_mode) {
      const user = await prisma.user.findUnique({ where: { id: user_id }});
      if (user && user.phone) {
        const message = `Emergix SOS Received! Help is on the way to ${landmark_text || 'your location'}.`;
        const smsDoc = await SmsModel.create({ to_number: user.phone, message });
        await smsQueue.add('sendSms', { smsId: smsDoc._id, to: user.phone, message });
      }
    }

    // 6. Emit WS Event to dashboard
    io.emit('sos:new', {
      incident_id: incident.id,
      type: incident.type,
      location: { lat: incident.locationLat, lng: incident.locationLng },
      ambulance_id
    });

    // 7. Calculate ETA (Mocking as 12 mins if mapped)
    const eta_minutes = ambulance_id ? 12 : null;
    if (ambulance_id) {
      await redisClient.set(`incident:eta:${incident.id}`, JSON.stringify({ eta_minutes, updated_at: new Date() }), { EX: 60 });
    }

    // Response
    return res.status(201).json({
      incident_id: incident.id,
      ambulance_id,
      driver: incident.ambulance ? {
        name: incident.ambulance.driver.name,
        phone: incident.ambulance.driver.phone
      } : null,
      eta_minutes,
      tracking_url: `/track/${incident.id}`
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to process SOS' });
  }
};

export const updateStatusSchema = z.object({
  status: z.enum(['DISPATCHED', 'ARRIVED', 'DELAYED', 'RESOLVED', 'CANCELLED'])
});

export const updateStatus = async (req, res) => {
  try {
    const { incidentId } = req.params;
    const { status } = req.body;

    const incident = await prisma.incident.update({
      where: { id: incidentId },
      data: { status },
      include: { user: true }
    });

    if (status === 'DELAYED') {
      const message = `Your ambulance is delayed due to traffic but is trying to reach you ASAP.`;
      const smsDoc = await SmsModel.create({ to_number: incident.user.phone, message });
      await smsQueue.add('sendSms', { smsId: smsDoc._id, to: incident.user.phone, message }, { attempts: 3 });
      
      io.to(`user_${incident.userId}`).emit('notification:push', { message });
    }

    io.emit('incident:update', { incidentId, status, updated_at: new Date() });
    return res.json({ success: true, incident });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to update status' });
  }
};

export const getIncident = async (req, res) => {
  try {
    const { incidentId } = req.params;
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: { ambulance: { include: { driver: true } }, routes: true }
    });

    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    let eta = null;
    const etaCache = await redisClient.get(`incident:eta:${incidentId}`);
    if (etaCache) {
      eta = JSON.parse(etaCache);
    }

    return res.json({
      ...incident,
      eta: eta?.eta_minutes || null
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch incident details' });
  }
};
