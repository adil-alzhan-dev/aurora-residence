import type { AdminRole } from '../generated/prisma/enums.js';

export interface AuthenticatedAdmin {
  id: number;
  email: string;
  name: string;
  role: AdminRole;
}

export interface AccessTokenPayload {
  sub: number;
  email: string;
  name: string;
  role: AdminRole;
}

export interface RefreshTokenPayload {
  sub: number;
  sid: string;
}

export interface IssuedSession {
  accessToken: string;
  accessExpiresIn: number;
  refreshToken: string;
  refreshExpiresAt: Date;
  admin: AuthenticatedAdmin;
}
