import { Router } from 'express';
import { internalAuth } from '../middlewares/auth.js';
import { queueSms, dispatchPush, dispatchIvr, notifyFamily, volunteerAlert } from '../controllers/notify.controller.js';

const router = Router();

router.use(internalAuth);

router.post('/sms', queueSms);
router.post('/push', dispatchPush);
router.post('/ivr', dispatchIvr);
router.post('/family', notifyFamily);
router.post('/volunteer-alert', volunteerAlert);

export default router;
