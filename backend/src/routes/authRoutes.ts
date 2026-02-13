import { Router } from 'express';
import { authController } from '../controllers/authController';
import { validate } from '../middleware/validate';
import { loginSchema } from '../schemas/authSchemas';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/login', validate(loginSchema), asyncHandler((req, res) => authController.login(req, res)));

export default router;
