import { randomUUID } from 'node:crypto';
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
const ADMIN_SELECT = { id: true, email: true, name: true, role: true } as const;

/**
 * Every access token carries the id of its session row and is accepted only
 * while that row is active, so logout and account removal take effect on the
 * next request instead of after the access token expires.
 */
@Injectable()
export class SessionsService {
  private readonly accessSecret = requireEnv('JWT_ACCESS_SECRET');
  private readonly refreshSecret = requireEnv('JWT_REFRESH_SECRET');

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async issue(admin: AuthenticatedAdmin): Promise<IssuedSession> {
    const refreshTokenId = randomUUID();
    const session = await this.prisma.adminSession.create({
      data: { adminUserId: admin.id, refreshTokenId, expiresAt: refreshExpiry() },
      select: { id: true, expiresAt: true },
    });
    return this.sign(admin, session.id, refreshTokenId, session.expiresAt);
  }

  /** Role and name come from the database, so changes apply immediately. */
  async verifyAccess(token: string): Promise<AuthenticatedAdmin> {
    const payload = await this.verify<AccessTokenPayload>(token, this.accessSecret);
    const session = await this.prisma.adminSession.findFirst({
      where: { id: payload.sid, adminUserId: payload.sub, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { adminUser: { select: ADMIN_SELECT } },
    });
    if (!session) throw new UnauthorizedException(SESSION_EXPIRED);
    return session.adminUser;
  }

  /**
   * Replaces the refresh token inside the same session. Access tokens issued
   * earlier in this session keep working until they expire; an old refresh
   * token is refused.
   */
  async rotate(refreshToken: string | undefined): Promise<IssuedSession> {
    const payload = await this.verify<RefreshTokenPayload>(refreshToken, this.refreshSecret);
    const refreshTokenId = randomUUID();
    const expiresAt = refreshExpiry();
    const rotated = await this.prisma.adminSession.updateMany({
      where: { id: payload.sid, refreshTokenId: payload.rid, revokedAt: null, expiresAt: { gt: new Date() } },
      data: { refreshTokenId, expiresAt },
    });
    if (rotated.count === 0) throw new UnauthorizedException(SESSION_EXPIRED);

    const admin = await this.prisma.adminUser.findUnique({ where: { id: payload.sub }, select: ADMIN_SELECT });
    if (!admin) throw new UnauthorizedException(SESSION_EXPIRED);
    return this.sign(admin, payload.sid, refreshTokenId, expiresAt);
  }

  /** Accepts either token, so logout works even if the cookie is already gone. */
  async revoke(refreshToken: string | undefined, accessToken: string | undefined): Promise<void> {
    const payload =
      (await this.verify<RefreshTokenPayload>(refreshToken, this.refreshSecret).catch(() => null)) ??
      (await this.verify<AccessTokenPayload>(accessToken, this.accessSecret).catch(() => null));
    if (!payload) return;
    await this.prisma.adminSession.updateMany({
      where: { id: payload.sid, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async sign(
    admin: AuthenticatedAdmin,
    sid: string,
    refreshTokenId: string,
    refreshExpiresAt: Date,
  ): Promise<IssuedSession> {
    const access: AccessTokenPayload = { sub: admin.id, sid };
    const refresh: RefreshTokenPayload = { sub: admin.id, sid, rid: refreshTokenId };
    const refreshTtl = Math.ceil((refreshExpiresAt.getTime() - Date.now()) / 1000);
    return {
      accessToken: await this.jwt.signAsync(access, { secret: this.accessSecret, expiresIn: ACCESS_TTL_SECONDS }),
      accessExpiresIn: ACCESS_TTL_SECONDS,
      refreshToken: await this.jwt.signAsync(refresh, { secret: this.refreshSecret, expiresIn: refreshTtl }),
      refreshExpiresAt,
      admin,
    };
  }

  private async verify<T extends object>(token: string | undefined, secret: string): Promise<T> {
    if (!token) throw new UnauthorizedException(SESSION_EXPIRED);
    try {
      return await this.jwt.verifyAsync<T>(token, { secret });
    } catch {
      throw new UnauthorizedException(SESSION_EXPIRED);
    }
  }
}

function refreshExpiry(): Date {
  return new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);
}
