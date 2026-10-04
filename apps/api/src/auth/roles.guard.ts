import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AdminRole } from '../generated/prisma/enums.js';
import type { AdminRequest } from './jwt-auth.guard.js';
import { ROLES_KEY } from './roles.decorator.js';

/** Runs after JwtAuthGuard; a route without @Roles is closed by default. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<AdminRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const admin = context.switchToHttp().getRequest<AdminRequest>().admin;
    if (!admin || !roles?.includes(admin.role)) {
      throw new ForbiddenException('Your role does not allow this action');
    }
    return true;
  }
}
