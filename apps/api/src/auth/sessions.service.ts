import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { requireEnv } from '../common/env.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  AccessTokenPayload,
  AuthenticatedAdmin,
  IssuedSession,
  RefreshTokenPayload,
} from './auth.types.js';

export const ACCESS_TTL_SECONDS = 15 * 60;
export const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

const SESSION_EXPIRED = 'Your session has expired, please sign in again';

/** Short-lived access JWT plus a refresh JWT bound to a revocable session row. */
@Injectable()
export class SessionsService {
  private readonly accessSecret = requireEnv('JWT_ACCESS_SECRET');
  private readonly refreshSecret = requireEnv('JWT_REFRESH_SECRET');

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async issue(admin: AuthenticatedAdmin): Promise<IssuedSession> {
    const refreshExpiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);
    const session = await this.prisma.adminSession.create({
      data: { adminUserId: admin.id, expiresAt: refreshExpiresAt },
      select: { id: true },
    });
    const access: AccessTokenPayload = {
      sub: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    };
    const refresh: RefreshTokenPayload = { sub: admin.id, sid: session.id };
    return {
      accessToken: await this.jwt.signAsync(access, {
        secret: this.accessSecret,
        expiresIn: ACCESS_TTL_SECONDS,
      }),
      accessExpiresIn: ACCESS_TTL_SECONDS,
      refreshToken: await this.jwt.signAsync(refresh, {
        secret: this.refreshSecret,
        expiresIn: REFRESH_TTL_SECONDS,
      }),
      refreshExpiresAt,
      admin,
    };
  }

  async verifyAccess(token: string): Promise<AuthenticatedAdmin> {
    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret: this.accessSecret,
      });
      return { id: payload.sub, email: payload.email, name: payload.name, role: payload.role };
    } catch {
      throw new UnauthorizedException(SESSION_EXPIRED);
    }
  }

  /** Revokes the presented refresh session and issues a new pair (rotation). */
  async rotate(refreshToken: string | undefined): Promise<IssuedSession> {
    const payload = await this.verifyRefresh(refreshToken);
    const revoked = await this.prisma.adminSession.updateMany({
      where: { id: payload.sid, revokedAt: null, expiresAt: { gt: new Date() } },
      data: { revokedAt: new Date() },
    });
    if (revoked.count === 0) throw new UnauthorizedException(SESSION_EXPIRED);

    const admin = await this.prisma.adminUser.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!admin) throw new UnauthorizedException(SESSION_EXPIRED);
    return this.issue(admin);
  }

  async revoke(refreshToken: string | undefined): Promise<void> {
    const payload = await this.verifyRefresh(refreshToken).catch(() => null);
    if (!payload) return;
    await this.prisma.adminSession.updateMany({
      where: { id: payload.sid, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async verifyRefresh(token: string | undefined): Promise<RefreshTokenPayload> {
    if (!token) throw new UnauthorizedException(SESSION_EXPIRED);
    try {
      return await this.jwt.verifyAsync<RefreshTokenPayload>(token, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException(SESSION_EXPIRED);
    }
  }
}
