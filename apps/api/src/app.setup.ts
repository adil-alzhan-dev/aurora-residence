import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { isHttpsEnabled } from './common/env.js';

/** Shared by main.ts and the e2e tests so both run the same pipeline. */
export function configureApp(app: NestExpressApplication): void {
  app.setGlobalPrefix('api');
  // nginx is the only hop in front of the API; trust it for the client IP.
  app.set('trust proxy', 1);
  const https = isHttpsEnabled();
  app.use(
    helmet({
      hsts: https,
      contentSecurityPolicy: { directives: { upgradeInsecureRequests: https ? [] : null } },
    }),
  );
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
