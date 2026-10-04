import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { LoginThrottleService } from './login-throttle.service.js';
import { RolesGuard } from './roles.guard.js';
import { SessionsService } from './sessions.service.js';

// Global so every admin module can use @AdminAccess() without re-importing auth.
@Global()
@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, LoginThrottleService, SessionsService, JwtAuthGuard, RolesGuard],
  exports: [SessionsService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
