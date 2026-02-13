import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { signToken, verifyPassword } from '../utils/auth';
import { AuthUser, LoginResponse } from '../../../shared/types';
import { userRoleMapper } from '../utils/mappers';

export class AuthService {
  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const role = userRoleMapper.fromPrisma(user.role);

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      role,
      customerName: user.customerName ?? undefined,
    };

    return {
      token: signToken({
        sub: user.id,
        email: user.email,
        role,
        customerName: user.customerName ?? undefined,
      }),
      user: authUser,
    };
  }
}

export const authService = new AuthService();
