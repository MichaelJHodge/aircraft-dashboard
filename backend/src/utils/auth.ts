import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { UserRole } from '../../../shared/types';
import { config } from '../config';

interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  customerName?: string;
}

export function signToken(payload: TokenPayload): string {
  const expiresIn = config.jwtExpiresIn as SignOptions['expiresIn'];

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn,
  });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
