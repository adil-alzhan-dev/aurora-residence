import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiError } from '../common/api-error.js';
import { ERROR_CODES } from '../common/error-codes.js';
import { PrismaService } from '../prisma/prisma.service.js';

export const EMAIL_MAX_ATTEMPTS = 5;
export const IP_MAX_ATTEMPTS = 20;
export const LOCK_MINUTES = 15;
const LOCK_MS = LOCK_MINUTES * 60_000;

export interface LoginAttempt {
  email: string;
  ip: string;
  emailAttempts: number;
  ipAttempts: number;
}

/**
 * Sign-in counters live in PostgreSQL, so a lockout survives restarts and is
 * shared by every API instance. The attempt is counted before the password is
 * checked: parallel requests cannot get more password checks than the limit.
 * The email counter ignores the IP, the IP counter ignores the email.
 */
@Injectable()
export class LoginThrottleService {
  constructor(private readonly prisma: PrismaService) {}

  async begin(email: string, ip: string, now = new Date()): Promise<LoginAttempt> {
    // IP first: a locked IP must not keep raising the counter of someone's email.
    const ipAttempts = await this.count(ipKey(ip), IP_MAX_ATTEMPTS, now);
    const emailAttempts = await this.count(emailKey(email), EMAIL_MAX_ATTEMPTS, now);
    return { email, ip, emailAttempts, ipAttempts };
  }

  async fail(attempt: LoginAttempt, now = new Date()): Promise<number> {
    const emailLeft = EMAIL_MAX_ATTEMPTS - attempt.emailAttempts;
    const ipLeft = IP_MAX_ATTEMPTS - attempt.ipAttempts;
    if (emailLeft <= 0) await this.lock(emailKey(attempt.email), now);
    if (ipLeft <= 0) await this.lock(ipKey(attempt.ip), now);
    if (emailLeft <= 0 || ipLeft <= 0) throw lockedException(LOCK_MS);
    return Math.min(emailLeft, ipLeft);
  }

  /** A successful sign-in clears the email series and does not count against the IP. */
  async succeed(attempt: LoginAttempt): Promise<void> {
    await this.prisma.loginThrottle.deleteMany({ where: { key: emailKey(attempt.email) } });
    await this.prisma.loginThrottle.updateMany({
      where: { key: ipKey(attempt.ip), attempts: { gt: 0 } },
      data: { attempts: { decrement: 1 } },
    });
  }

  private async count(key: string, limit: number, now: Date): Promise<number> {
    // A new series starts after 15 quiet minutes or when the lock is over.
    await this.prisma.loginThrottle.updateMany({
      where: {
        key,
        OR: [{ lastAttemptAt: { lt: new Date(now.getTime() - LOCK_MS) } }, { lockedUntil: { lte: now } }],
      },
      data: { attempts: 0, lockedUntil: null },
    });
    const row = await this.prisma.loginThrottle.upsert({
      where: { key },
      create: { key, attempts: 1, lastAttemptAt: now },
      update: { attempts: { increment: 1 }, lastAttemptAt: now },
      select: { attempts: true, lockedUntil: true },
    });
    if (row.lockedUntil && row.lockedUntil > now) {
      throw lockedException(row.lockedUntil.getTime() - now.getTime());
    }
    if (row.attempts > limit) {
      await this.lock(key, now);
      throw lockedException(LOCK_MS);
    }
    return row.attempts;
  }

  private async lock(key: string, now: Date): Promise<void> {
    await this.prisma.loginThrottle.updateMany({
      where: { key, OR: [{ lockedUntil: null }, { lockedUntil: { lte: now } }] },
      data: { lockedUntil: new Date(now.getTime() + LOCK_MS) },
    });
  }
}

function emailKey(email: string): string {
  return `email:${email.trim().toLowerCase()}`;
}

function ipKey(ip: string): string {
  return `ip:${ip}`;
}

// The same answer for an email lock and an IP lock; unknown emails lock the same way.
function lockedException(remainingMs: number): ApiError {
  const retryAfterSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return new ApiError(
    HttpStatus.TOO_MANY_REQUESTS,
    ERROR_CODES.LOGIN_LOCKED,
    `Too many failed sign-in attempts. Sign-in is paused, try again in ${minutes} ${plural(minutes, 'minute')}.`,
    { retryAfterSeconds },
  );
}

export function plural(count: number, word: string): string {
  return count === 1 ? word : `${word}s`;
}
