import { PrismaClient } from '@prisma/client';
import { redisClient } from '../config/redis.js';
import axios from 'axios';

const prisma = new PrismaClient();

export const getLiveTrack = async (req, res) => {
  try {
    const { incidentId } = req.params;
    
    // Attempt pulling static state and routes
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: { 
        ambulance: { include: { driver: true } },
        routes: { orderBy: { createdAt: 'desc' }, take: 1 } 
      }
    });

    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    const ambulance = incident.ambulance;
    let driverLiveLocation = null;
    let etaCache = null;

    if (ambulance) {
      // Extract latest GPS override from Cache
      const locStr = await redisClient.get(`driver:location:${ambulance.driverId}`);
      if (locStr) driverLiveLocation = JSON.parse(locStr);

      // Extract fresh ETA Cache
      const etaStr = await redisClient.get(`incident:eta:${incidentId}`);
      if (etaStr) etaCache = JSON.parse(etaStr);
    }

    res.json({
      driver: ambulance ? {
        name: ambulance.driver.name,
        phone: ambulance.driver.phone,
        lat: driverLiveLocation?.lat || ambulance.currentLat,
        lng: driverLiveLocation?.lng || ambulance.currentLng,
        eta_minutes: etaCache?.eta_minutes || null
      } : null,
      route_polyline: incident.routes.length ? incident.routes[0].polyline : null,
      status: incident.status
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve live track' });
  }
};

export const calculateRoute = async (req, res) => {
  try {
    const { origin, destination, mode, incident_id } = req.body;

    // Connects to public Open Source Routing Machine
    const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=polyline`;
    
    const response = await axios.get(osrmUrl);
    if (response.data.code !== 'Ok') throw new Error('OSRM Route failed');

    const routeData = response.data.routes[0];
    const polyline = routeData.geometry;
    const distanceKm = routeData.distance / 1000;
    const durationMin = routeData.duration / 60;

    if (incident_id) {
       await prisma.route.create({
         data: {
           incidentId: incident_id,
           polyline,
           distanceKm,
           durationMin,
           routeType: mode === 'SHORTEST' ? 'SHORTEST' : 'FASTEST',
           trafficApplied: true 
         }
       });
    }

    res.json({
      polyline,
      distance_km: distanceKm,
      duration_min: durationMin,
      waypoints: routeData.legs[0].steps || []
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to calculate route' });
  }
};

// Math Utils
function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export const getNearbyAmbulances = async (req, res) => {
  try {
    const { lat, lng, radius_km } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'Missing lat/lng query parameters' });
    
    const searchLat = parseFloat(lat);
    const searchLng = parseFloat(lng);
    const radius = parseFloat(radius_km || 10);

    // Using `keys` internally since standard scale - mapped appropriately 
    const keys = await redisClient.keys('driver:location:*');
    
    if (keys.length === 0) return res.json({ ambulances: [] });

    // mGet fetches all properties synchronously from redis O(N) where N is driver count in region
    const values = await redisClient.mGet(keys);

    const nearby = [];
    keys.forEach((key, index) => {
      if (values[index]) {
        const driverId = key.split(':')[2];
        const loc = JSON.parse(values[index]);
        
        const dist = getHaversineDistance(searchLat, searchLng, loc.lat, loc.lng);
        
        if (dist <= radius) {
          // Assume mapping static speed limit logic of 40km/h avg speed for inner traffic
          const eta_minutes = Math.round((dist / 40) * 60);
          
          nearby.push({
            driver_id: driverId,
            distance_km: dist.toFixed(2),
            eta_minutes,
            lat: loc.lat,
            lng: loc.lng,
            speed: loc.speed
          });
        }
      }
    });

    // Sort by fastest to reach destination based on direct distance
    nearby.sort((a, b) => parseFloat(a.distance_km) - parseFloat(b.distance_km));

    res.json({ ambulances: nearby });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to find nearby ambulances' });
  }
};
