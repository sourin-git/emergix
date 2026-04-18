import { redisClient } from '../config/redis.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const setupSockets = (io) => {
  io.on('connection', (socket) => {
    socket.on('join_incident', (incidentId) => {
      // Subscribe this client to the specific incident room
      socket.join(`incident_${incidentId}`);
    });

    socket.on('driver:location:update', async (data) => {
      const { driver_id, lat, lng, speed, heading, incident_id } = data;
      
      const locData = { lat, lng, speed, heading, updated_at: new Date() };

      // 1. Store in Redis Key Pattern with TTL 30s
      await redisClient.set(`driver:location:${driver_id}`, JSON.stringify(locData), { EX: 30 });

      let activeIncidentId = incident_id;
      
      if (!activeIncidentId) {
        // Fallback: If payload lacks incident ID, fetch current active dispatch
        const activeAmbulance = await prisma.ambulance.findUnique({
          where: { driverId: driver_id },
          include: { 
            incidents: { 
              where: { status: { in: ['DISPATCHED', 'ARRIVED'] } },
              take: 1 
            } 
          }
        });
        if (activeAmbulance && activeAmbulance.incidents.length > 0) {
          activeIncidentId = activeAmbulance.incidents[0].id;
        }
      }

      // 2. Broadcast via Pub/Sub to subscribers of that incident
      if (activeIncidentId) {
         io.to(`incident_${activeIncidentId}`).emit('ambulance:location', {
          driver_id,
          ...locData
        });
      }
    });
  });
};
