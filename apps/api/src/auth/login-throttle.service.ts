import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;
const LOCK_MS = LOCK_MINUTES * 60_000;

/**
 * Sign-in lockout per email + IP, stored in PostgreSQL so it survives API
 * restarts and does not depend on a single process.
 */
@Injectable()
export class LoginThrottleService {
  constructor(private readonly prisma: PrismaService) {}

  async assertNotLocked(email: string, ip: string, now = new Date()): Promise<void> {
    const row = await this.prisma.loginThrottle.findUnique({
      where: { email_ip: { email, ip } },
      select: { lockedUntil: true },
    });
    if (row?.lockedUntil && row.lockedUntil > now) {
      throw lockedException(row.lockedUntil.getTime() - now.getTime());
    }
  }

  /** Records a failed attempt and returns how many attempts are left before the lock. */
  async registerFailure(email: string, ip: string, now = new Date()): Promise<number> {
    const key = { email, ip };
    // Start a new series after a quiet period or after an expired lock.
    await this.prisma.loginThrottle.updateMany({
      where: {
        ...key,
        OR: [{ lastFailedAt: { lt: new Date(now.getTime() - LOCK_MS) } }, { lockedUntil: { lte: now } }],
      },
      data: { failedCount: 0, lockedUntil: null },
    });
    const row = await this.prisma.loginThrottle.upsert({
      where: { email_ip: key },
      create: { ...key, failedCount: 1, lastFailedAt: now },
      update: { failedCount: { increment: 1 }, lastFailedAt: now },
      select: { failedCount: true },
    });
    const attemptsLeft = MAX_FAILED_ATTEMPTS - row.failedCount;
    if (attemptsLeft <= 0) {
      await this.prisma.loginThrottle.update({
        where: { email_ip: key },
        data: { lockedUntil: new Date(now.getTime() + LOCK_MS) },
      });
      throw lockedException(LOCK_MS);
    }
    return attemptsLeft;
  }

  async clear(email: string, ip: string): Promise<void> {
    await this.prisma.loginThrottle.deleteMany({ where: { email, ip } });
  }
}

function lockedException(remainingMs: number): HttpException {
  const retryAfterSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return new HttpException(
    {
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      error: 'Too Many Requests',
      message: `Too many failed attempts. Sign-in is paused, try again in ${minutes} ${plural(minutes, 'minute')}.`,
      retryAfterSeconds,
    },
    HttpStatus.TOO_MANY_REQUESTS,
  );
}

export function plural(count: number, word: string): string {
  return count === 1 ? word : `${word}s`;
}
