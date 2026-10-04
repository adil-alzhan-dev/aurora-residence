import { execFileSync } from 'node:child_process';
import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { ReservationsScheduler } from '../src/reservations/reservations.scheduler.js';
import { TEST_ADMIN } from './test-env.js';

/** Restores the demo data in the test database (same seed as production). */
export function reseed(): void {
  execFileSync('node_modules/.bin/tsx', ['prisma/seed.ts'], { env: process.env, stdio: 'ignore' });
}

export async function createTestApp(): Promise<NestExpressApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    // The cron job is exercised directly through the service, not by the clock.
    .overrideProvider(ReservationsScheduler)
    .useValue({})
    .compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: ['error'] });
  configureApp(app);
  await app.init();
  return app;
}

export function http(app: INestApplication) {
  return request(app.getHttpServer() as App);
}

export async function signIn(app: INestApplication): Promise<string> {
  const response = await http(app)
    .post('/api/auth/login')
    .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password })
    .expect(200);
  return (response.body as { accessToken: string }).accessToken;
}
