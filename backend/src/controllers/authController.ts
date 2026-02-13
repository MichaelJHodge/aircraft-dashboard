import { Request, Response } from 'express';
import { authService } from '../services/authService';

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    const result = await authService.login(req.body.email, req.body.password);
    res.json(result);
  }
}

export const authController = new AuthController();
