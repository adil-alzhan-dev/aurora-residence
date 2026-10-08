import type { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp, http, reseed } from './app.js';
import { TEST_ADMIN } from './test-env.js';

interface ErrorBody {
  statusCode: number;
  code: string;
  message: string;
  attemptsLeft?: number;
  retryAfterSeconds?: number;
}

const LOCKED = /Too many failed sign-in attempts\. Sign-in is paused, try again in 15 minutes/;

describe('Sign-in lockout (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    reseed();
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterEach(async () => {
    await prisma.loginThrottle.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  const login = (email: string, password: string, ip: string) =>
    http(app).post('/api/auth/login').set('X-Forwarded-For', ip).send({ email, password });

  it('answers a wrong password and an unknown email with the same message', async () => {
    const wrongPassword = await login(TEST_ADMIN.email, 'wrong-password', '10.1.0.1').expect(401);
    const unknownEmail = await login('nobody@example.com', 'whatever', '10.1.0.2').expect(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
    expect(wrongPassword.body).toEqual({
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
      message: 'Wrong email or password. 4 attempts left, then sign-in pauses for 15 minutes.',
      attemptsLeft: 4,
    });
  });

  it('locks the email for 15 minutes after 5 failures from different IPs and email spellings', async () => {
    const spellings = [
      TEST_ADMIN.email,
      TEST_ADMIN.email.toUpperCase(),
      `  ${TEST_ADMIN.email}  `,
      'Maya.Collins@Aurora-Residence.com',
    ];
    for (const [index, email] of spellings.entries()) {
      const response = await login(email, 'wrong-password', `10.2.0.${index + 1}`).expect(401);
      expect((response.body as ErrorBody).attemptsLeft).toBe(4 - index);
    }
    const fifth = await login(TEST_ADMIN.email, 'wrong-password', '10.2.0.5').expect(429);
    expect(fifth.body).toEqual({
      statusCode: 429,
      code: 'LOGIN_LOCKED',
      message: expect.stringMatching(LOCKED) as string,
      retryAfterSeconds: 900,
    });

    const fromNewIp = await login(TEST_ADMIN.email, TEST_ADMIN.password, '10.2.0.6').expect(429);
    expect((fromNewIp.body as ErrorBody).message).toMatch(LOCKED);
  });

  it('locks an unknown email the same way, so a lock does not reveal accounts', async () => {
    for (let i = 1; i <= 4; i += 1) await login('nobody@example.com', 'x', `10.3.0.${i}`).expect(401);
    const locked = await login('nobody@example.com', 'x', '10.3.0.5').expect(429);
    expect((locked.body as ErrorBody).message).toMatch(LOCKED);
  });

  it('answers the 5th failure with the same full body for a real and an unknown email', async () => {
    const failFiveTimes = async (email: string, subnet: number) => {
      for (let i = 1; i <= 4; i += 1) await login(email, 'wrong', `10.8.${subnet}.${i}`).expect(401);
      return login(email, 'wrong', `10.8.${subnet}.5`).expect(429);
    };
    const realEmail = await failFiveTimes(TEST_ADMIN.email, 1);
    const unknownEmail = await failFiveTimes('nobody@example.com', 2);

    const expected = {
      statusCode: 429,
      code: 'LOGIN_LOCKED',
      message: 'Too many failed sign-in attempts. Sign-in is paused, try again in 15 minutes.',
      retryAfterSeconds: 900,
    };
    expect(realEmail.body).toEqual(expected);
    expect(unknownEmail.body).toEqual(expected);
  });

  it('opens sign-in again when the lock is over', async () => {
    for (let i = 1; i <= 5; i += 1) await login(TEST_ADMIN.email, 'wrong', `10.4.0.${i}`);
    await login(TEST_ADMIN.email, TEST_ADMIN.password, '10.4.0.9').expect(429);

    await prisma.loginThrottle.updateMany({ data: { lockedUntil: new Date(Date.now() - 1000) } });
    await login(TEST_ADMIN.email, TEST_ADMIN.password, '10.4.0.9').expect(200);
  });

  it('limits failures from one IP across any emails', async () => {
    const ip = '10.5.0.1';
    for (let i = 1; i <= 19; i += 1) {
      await login(`guess${i}@example.com`, 'wrong', ip).expect(401);
    }
    const twentieth = await login('guess20@example.com', 'wrong', ip).expect(429);
    expect((twentieth.body as ErrorBody).message).toMatch(LOCKED);

    await login(TEST_ADMIN.email, TEST_ADMIN.password, ip).expect(429);
    await login(TEST_ADMIN.email, TEST_ADMIN.password, '10.5.0.2').expect(200);
  });

  it('does not let parallel failures check more passwords than the limit', async () => {
    const results = await Promise.all(
      Array.from({ length: 8 }, (_, i) => login(TEST_ADMIN.email, 'wrong', `10.6.0.${i + 1}`)),
    );
    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([401, 401, 401, 401, 429, 429, 429, 429]);
    await login(TEST_ADMIN.email, TEST_ADMIN.password, '10.6.0.9').expect(429);
  });

  it('clears the email series after a successful sign-in', async () => {
    await login(TEST_ADMIN.email, 'wrong', '10.7.0.1').expect(401);
    await login(TEST_ADMIN.email, TEST_ADMIN.password, '10.7.0.1').expect(200);
    const next = await login(TEST_ADMIN.email, 'wrong', '10.7.0.2').expect(401);
    expect((next.body as ErrorBody).attemptsLeft).toBe(4);
  });
});
