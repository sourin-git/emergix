import { Router } from 'express';
import { triggerSOS, updateStatus, getIncident, triggerSosSchema, updateStatusSchema } from '../controllers/sos.controller.js';
import { validate } from '../middlewares/validate.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

router.post('/trigger', authMiddleware, validate(triggerSosSchema), triggerSOS);
router.post('/:incidentId/status', authMiddleware, validate(updateStatusSchema), updateStatus);
router.get('/:incidentId', authMiddleware, getIncident);

export default router;
