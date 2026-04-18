import { redisClient } from '../config/redis.js';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Calculates the great-circle distance between two points on the Earth's surface.
 */
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
}

export const findNearestAmbulance = async (lat, lng, maxRadiusKm = 10) => {
  // Pull all available ambulances from the PG DB
  const availableAmbulances = await prisma.ambulance.findMany({
    where: { status: 'AVAILABLE' }
  });

  let nearest = null;
  let minDistance = maxRadiusKm;

  // Verify real-time GPS coords through Redis cache using Haversine
  for (const ambulance of availableAmbulances) {
    const locStr = await redisClient.get(`driver:location:${ambulance.driverId}`);
    if (locStr) {
      const loc = JSON.parse(locStr);
      const distance = getDistanceFromLatLonInKm(lat, lng, loc.lat, loc.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = ambulance;
      }
    } else {
      // Fallback: If no activity in redis, check static DB cache
      if (ambulance.currentLat && ambulance.currentLng) {
         const distance = getDistanceFromLatLonInKm(lat, lng, ambulance.currentLat, ambulance.currentLng);
         if (distance < minDistance) {
           minDistance = distance;
           nearest = ambulance;
         }
      }
    }
  }

  return nearest;
};

export const getVolunteersWithinRadius = async (lat, lng, radiusKm = 10) => {
   const allVols = await prisma.volunteer.findMany({ 
     where: { isAvailable: true }, 
     include: { user: true }
   });
   
   return allVols.filter(vol => {
      if(!vol.user.locationLat || !vol.user.locationLng) return false;
      const dist = getDistanceFromLatLonInKm(lat, lng, vol.user.locationLat, vol.user.locationLng);
      return dist <= radiusKm;
   });
};
