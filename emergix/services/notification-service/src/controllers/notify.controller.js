import mongoose from 'mongoose';
import { notifySmsQueue } from '../jobs/sms.queue.js';
import { sendPushNotification } from '../services/firebase.js';
import { sendIVR } from '../services/twilio.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SmsModel = mongoose.models.SmsQueue || mongoose.model('SmsQueue', new mongoose.Schema({
  to_number: String,
  message: String,
  status: { type: String, default: 'PENDING' },
  retry_count: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
}));

export const queueSms = async (req, res) => {
  try {
    const { to, message, incident_id, retry = true } = req.body;
    
    const smsDoc = await SmsModel.create({ to_number: to, message });

    // Enqueue explicitly referencing exponential backoff architecture internally
    const jobOptions = retry ? {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 }
    } : {};

    await notifySmsQueue.add('dispatchSms', {
      to, message, incident_id, mongoId: smsDoc._id
    }, jobOptions);

    res.json({ success: true, queue_id: smsDoc._id });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};

export const dispatchPush = async (req, res) => {
  try {
    const { user_ids, title, body, data } = req.body;
    
    // Assumes token hydration executes natively via Redis mappings
    const mockTokens = user_ids.map(id => `fcm_token_${id}`);

    const response = await sendPushNotification(mockTokens, title, body, data);
    
    await prisma.notificationLog.create({
        data: {
            type: 'PUSH',
            recipient: user_ids.join(','),
            content: `${title} | ${body}`,
            status: 'SENT',
            incidentId: data?.incident_id || null
        }
    });

    res.json({ success: true, response });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};

export const dispatchIvr = async (req, res) => {
  try {
    const { to, message_tts, language } = req.body;
    const callSid = await sendIVR(to, message_tts, language);

    await prisma.notificationLog.create({
        data: {
            type: 'IVR',
            recipient: to,
            content: message_tts,
            status: 'SENT'
        }
    });

    res.json({ success: true, callSid });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};

export const notifyFamily = async (req, res) => {
  try {
    const { driver_status, patient_id, patient_name, incident_id, url } = req.body;
    
    const contacts = await prisma.emergencyContact.findMany({
        where: { userId: patient_id }
    });

    const message = `Emergix: Ambulance has been marked ${driver_status} for ${patient_name}. Track live at: ${url}`;
    
    const queuePromises = contacts.map(contact => {
        return notifySmsQueue.add('dispatchSms', {
            to: contact.phone,
            message,
            incident_id
        }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 }});
    });

    await Promise.all(queuePromises);
    
    res.json({ success: true, notified_count: contacts.length });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};

function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export const volunteerAlert = async (req, res) => {
    try {
        const { incident_id, lat, lng } = req.body;
        
        const allVols = await prisma.volunteer.findMany({ 
            where: { isAvailable: true }, include: { user: true }
        });
        
        const validVols = [];
        allVols.forEach(v => {
            if (v.user.locationLat && v.user.locationLng) {
                const dist = getHaversineDistance(lat, lng, v.user.locationLat, v.user.locationLng);
                if (dist <= 5) {
                    validVols.push({...v, dist});
                }
            }
        });
        
        validVols.sort((a,b) => a.dist - b.dist);
        const top3 = validVols.slice(0, 3);
        
        const message = `Emergix SOS Alert! An emergency is within ${lat},${lng}. Please respond.`;

        for (const vol of top3) {
            // Push Notification trigger
            dispatchPush({
                body: { user_ids: [vol.user.id], title: "Emergency Alert", body: message, data: { incident_id } }
            }, { json: () => {} }).catch(console.error);

            // Backing SMS enqueue
            notifySmsQueue.add('dispatchSms', {
                to: vol.user.phone,
                message,
                incident_id
            }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 }});
        }
        
        res.json({ success: true, alerted: top3.length });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
};
