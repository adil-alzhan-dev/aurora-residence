import { applyDecorators, UseGuards } from '@nestjs/common';
import type { AdminRole } from '../generated/prisma/enums.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { Roles } from './roles.decorator.js';
import { RolesGuard } from './roles.guard.js';

/** Every admin route: valid access token plus one of the listed roles. */
export function AdminAccess(...roles: AdminRole[]) {
  const allowed: AdminRole[] = roles.length > 0 ? roles : ['ADMIN', 'MANAGER'];
  return applyDecorators(Roles(...allowed), UseGuards(JwtAuthGuard, RolesGuard));
}
