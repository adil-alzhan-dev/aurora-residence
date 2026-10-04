import type { AdminRole } from '../generated/prisma/enums.js';

export interface AuthenticatedAdmin {
  id: number;
  email: string;
  name: string;
  role: AdminRole;
}

export interface AccessTokenPayload {
  sub: number;
  sid: string;
}

export interface RefreshTokenPayload {
  sub: number;
  sid: string;
  /** Matches AdminSession.refreshTokenId while this refresh token is the current one. */
  rid: string;
}

export interface IssuedSession {
  accessToken: string;
  accessExpiresIn: number;
  refreshToken: string;
  refreshExpiresAt: Date;
  admin: AuthenticatedAdmin;
}
