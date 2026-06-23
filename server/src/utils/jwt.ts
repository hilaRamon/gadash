import jwt, { type SignOptions } from 'jsonwebtoken';
import { EMPLOYEE_ROLE_ADMIN } from '../models/Employee';
import type { AuthUser, JwtPayload } from '../types/auth';
import { HttpError } from './httpError';

const ADMIN_TOKEN_EXPIRY = '24h';
const EMPLOYEE_TOKEN_EXPIRY = '8h';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return secret;
}

export function signAuthToken(user: AuthUser): string {
  const expiresIn: SignOptions['expiresIn'] =
    user.role === EMPLOYEE_ROLE_ADMIN
      ? ADMIN_TOKEN_EXPIRY
      : EMPLOYEE_TOKEN_EXPIRY;

  return jwt.sign(
    {
      sub: user.employeeId,
      name: user.name,
      role: user.role,
    },
    getJwtSecret(),
    { expiresIn },
  );
}

export function verifyAuthToken(token: string): AuthUser {
  try {
    const payload = jwt.verify(token, getJwtSecret()) as JwtPayload;
    return {
      employeeId: payload.sub,
      name: payload.name,
      role: payload.role,
    };
  } catch {
    throw new HttpError(401, 'פג תוקף ההתחברות');
  }
}
