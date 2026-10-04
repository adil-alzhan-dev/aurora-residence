import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';
import { LOGIN_RATE_LIMIT } from '../common/throttle.js';
import { AdminAccess } from './admin-access.decorator.js';
import { AuthService } from './auth.service.js';
import type { AuthenticatedAdmin, IssuedSession } from './auth.types.js';
import { CurrentAdmin } from './current-admin.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { SessionsService } from './sessions.service.js';
import { isHttpsEnabled } from '../common/env.js';

export const REFRESH_COOKIE = 'aurora_refresh';

interface SessionResponse {
  accessToken: string;
  expiresIn: number;
  admin: AuthenticatedAdmin;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionsService,
  ) {}

  @Post('login')
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  @Throttle(LOGIN_RATE_LIMIT)
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SessionResponse> {
    const session = await this.auth.login(dto, request.ip ?? 'unknown');
    return respondWithSession(response, session);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SessionResponse> {
    const session = await this.sessions.rotate(readRefreshCookie(request));
    return respondWithSession(response, session);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.sessions.revoke(readRefreshCookie(request));
    response.clearCookie(REFRESH_COOKIE, cookieOptions());
  }

  @Get('me')
  @AdminAccess()
  me(@CurrentAdmin() admin: AuthenticatedAdmin): Promise<AuthenticatedAdmin> {
    return this.auth.profile(admin.id);
  }
}

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttpsEnabled(),
    path: '/api/auth',
  };
}

function readRefreshCookie(request: Request): string | undefined {
  const cookies = request.cookies as Record<string, string | undefined> | undefined;
  return cookies?.[REFRESH_COOKIE];
}

function respondWithSession(response: Response, session: IssuedSession): SessionResponse {
  response.cookie(REFRESH_COOKIE, session.refreshToken, {
    ...cookieOptions(),
    expires: session.refreshExpiresAt,
  });
  return {
    accessToken: session.accessToken,
    expiresIn: session.accessExpiresIn,
    admin: session.admin,
  };
}
