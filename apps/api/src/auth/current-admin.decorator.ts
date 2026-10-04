import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedAdmin } from './auth.types.js';
import type { AdminRequest } from './jwt-auth.guard.js';

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedAdmin => {
    const admin = context.switchToHttp().getRequest<AdminRequest>().admin;
    if (!admin) throw new Error('CurrentAdmin used on a route without JwtAuthGuard');
    return admin;
  },
);
