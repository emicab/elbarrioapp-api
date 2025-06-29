import { Router } from 'express';
import { showRedeemPageController, redeemTokenController } from './redeem.controller';

const router = Router();
router.get('/:token', showRedeemPageController);
router.post('/:token', redeemTokenController);

export default router;