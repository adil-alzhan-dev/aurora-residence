import type { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp, http, reseed } from './app.js';
import { TEST_ADMIN } from './test-env.js';

interface SignedIn {
  accessToken: string;
  cookie: string[];
}

describe('Sessions (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    reseed();
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  const signIn = async (): Promise<SignedIn> => {
    const response = await http(app)
      .post('/api/auth/login')
      .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password })
      .expect(200);
    return {
      accessToken: (response.body as { accessToken: string }).accessToken,
      cookie: response.headers['set-cookie'] as unknown as string[],
    };
  };
  const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

  it('closes /api/admin/* for the old access token right after logout', async () => {
    const session = await signIn();
    await http(app).get('/api/admin/enquiries').set(bearer(session.accessToken)).expect(200);

    await http(app).post('/api/auth/logout').set('Cookie', session.cookie).expect(204);

    const after = await http(app).get('/api/admin/enquiries').set(bearer(session.accessToken)).expect(401);
    expect((after.body as { message: string }).message).toBe('Your session has expired, please sign in again');
    await http(app)
      .patch('/api/admin/residences/6.01')
      .set(bearer(session.accessToken))
      .send({ priceUsd: 1_000_000 })
      .expect(401);
    await http(app).get('/api/auth/me').set(bearer(session.accessToken)).expect(401);
  });

  it('logs out with the access token alone when the cookie is missing', async () => {
    const session = await signIn();
    await http(app).post('/api/auth/logout').set(bearer(session.accessToken)).expect(204);
    await http(app).get('/api/admin/dashboard').set(bearer(session.accessToken)).expect(401);
    await http(app).post('/api/auth/refresh').set('Cookie', session.cookie).expect(401);
  });

  it('signs out only the session that logged out', async () => {
    const laptop = await signIn();
    const phone = await signIn();
    await http(app).post('/api/auth/logout').set('Cookie', laptop.cookie).expect(204);
    await http(app).get('/api/admin/dashboard').set(bearer(phone.accessToken)).expect(200);
  });

  it('keeps the session on refresh and refuses the old refresh token', async () => {
    const session = await signIn();
    const refreshed = await http(app).post('/api/auth/refresh').set('Cookie', session.cookie).expect(200);
    const newAccess = (refreshed.body as { accessToken: string }).accessToken;

    await http(app).get('/api/admin/dashboard').set(bearer(session.accessToken)).expect(200);
    await http(app).get('/api/admin/dashboard').set(bearer(newAccess)).expect(200);
    await http(app).post('/api/auth/refresh').set('Cookie', session.cookie).expect(401);

    await http(app).post('/api/auth/logout').set('Cookie', refreshed.headers['set-cookie']).expect(204);
    await http(app).get('/api/admin/dashboard').set(bearer(session.accessToken)).expect(401);
    await http(app).get('/api/admin/dashboard').set(bearer(newAccess)).expect(401);
  });

  it('applies a role change and a removed session on the next request', async () => {
    const session = await signIn();
    await prisma.adminUser.update({ where: { email: TEST_ADMIN.email }, data: { role: 'MANAGER' } });
    const me = await http(app).get('/api/auth/me').set(bearer(session.accessToken)).expect(200);
    expect((me.body as { role: string }).role).toBe('MANAGER');
    await prisma.adminUser.update({ where: { email: TEST_ADMIN.email }, data: { role: 'ADMIN' } });

    await prisma.adminSession.deleteMany();
    await http(app).get('/api/admin/dashboard').set(bearer(session.accessToken)).expect(401);
  });
});
