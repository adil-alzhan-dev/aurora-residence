import { HttpStatus, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { ApiError } from '../common/api-error.js';
import { ERROR_CODES } from '../common/error-codes.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { IssuedSession } from './auth.types.js';
import type { LoginDto } from './dto/login.dto.js';
import { LOCK_MINUTES, LoginThrottleService, plural } from './login-throttle.service.js';
import { SessionsService } from './sessions.service.js';

@Injectable()
export class AuthService {
  // Verifying against a throwaway hash keeps unknown emails as slow as wrong passwords.
  private readonly timingGuardHash = argon2.hash('timing-guard-not-a-password');

  constructor(
    private readonly prisma: PrismaService,
    private readonly throttle: LoginThrottleService,
    private readonly sessions: SessionsService,
  ) {}

  async login(dto: LoginDto, ip: string): Promise<IssuedSession> {
    const attempt = await this.throttle.begin(dto.email, ip);

    const admin = await this.prisma.adminUser.findUnique({ where: { email: dto.email } });
    const passwordHash = admin?.passwordHash ?? (await this.timingGuardHash);
    const valid = await argon2.verify(passwordHash, dto.password);

    if (!admin || !valid) {
      const attemptsLeft = await this.throttle.fail(attempt);
      throw new ApiError(
        HttpStatus.UNAUTHORIZED,
        ERROR_CODES.INVALID_CREDENTIALS,
        `Wrong email or password. ${attemptsLeft} ${plural(attemptsLeft, 'attempt')} left, ` +
          `then sign-in pauses for ${LOCK_MINUTES} minutes.`,
        { attemptsLeft },
      );
    }

    await this.throttle.succeed(attempt);
    return this.sessions.issue({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });
  }
}
