import { UserRole } from '../../../shared/types';

declare module 'express-serve-static-core' {
  interface Request {
    auth?: {
      userId: string;
      email: string;
      role: UserRole;
      customerName?: string;
    };
  }
}
