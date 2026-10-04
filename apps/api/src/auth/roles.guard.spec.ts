import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AdminRole } from '../generated/prisma/enums.js';
import { RolesGuard } from './roles.guard.js';

function contextFor(role: AdminRole | null, allowed: AdminRole[] | undefined): [RolesGuard, ExecutionContext] {
  const reflector = new Reflector();
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(allowed);
  const request = { admin: role ? { id: 1, email: 'a@example.com', name: 'A', role } : undefined };
  const context = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return [new RolesGuard(reflector), context];
}

describe('RolesGuard', () => {
  it('lets in a role from the list', () => {
    const [guard, context] = contextFor('MANAGER', ['ADMIN', 'MANAGER']);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('answers 403 for a role outside the list', () => {
    const [guard, context] = contextFor('MANAGER', ['ADMIN']);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('closes a route that has no @Roles metadata', () => {
    const [guard, context] = contextFor('ADMIN', undefined);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
