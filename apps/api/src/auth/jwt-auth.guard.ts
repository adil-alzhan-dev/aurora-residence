import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedAdmin } from './auth.types.js';
import { SessionsService } from './sessions.service.js';

export type AdminRequest = Request & { admin?: AuthenticatedAdmin };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly sessions: SessionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Sign in to access the admin area');
    }
    request.admin = await this.sessions.verifyAccess(token);
    return true;
  }
}
