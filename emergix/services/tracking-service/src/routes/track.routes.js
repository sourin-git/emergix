import { Router } from 'express';
import { getLiveTrack, calculateRoute, getNearbyAmbulances } from '../controllers/track.controller.js';

const router = Router();

// /api/track/...
router.get('/ambulances/nearby', getNearbyAmbulances);
router.get('/:incidentId/live', getLiveTrack);
router.post('/route', calculateRoute);

export default router;
