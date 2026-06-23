import { Router } from 'express';
import { authController } from '../controllers/authController';
import { requireAuth } from '../middleware/authMiddleware';

export const authRouter = Router();

authRouter.get('/login-options', authController.loginOptions);
authRouter.post('/login', authController.login);
authRouter.get('/me', requireAuth, authController.me);
