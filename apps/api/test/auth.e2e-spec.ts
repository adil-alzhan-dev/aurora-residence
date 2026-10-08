import type { INestApplication } from '@nestjs/common';
import { createTestApp, expectError, http, reseed, signIn } from './app.js';
import { TEST_ADMIN } from './test-env.js';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    reseed();
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  const login = (password: string, ip: string) =>
    http(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', ip)
      .send({ email: TEST_ADMIN.email, password });

  it('signs in, sets the refresh cookie and returns the profile from /me', async () => {
    const response = await login(TEST_ADMIN.password, '10.0.0.1').expect(200);
    const cookie = String(response.headers['set-cookie']);
    expect(cookie).toMatch(/aurora_refresh=/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
    expect(cookie).toMatch(/Path=\/api\/auth/);

    const body = response.body as { accessToken: string; expiresIn: number };
    expect(body.expiresIn).toBe(900);
    const me = await http(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${body.accessToken}`)
      .expect(200);
    expect(me.body).toMatchObject({ email: TEST_ADMIN.email, name: TEST_ADMIN.name, role: 'MANAGER' });
    expect(Object.keys(me.body as object).sort()).toEqual(['email', 'id', 'name', 'role']);
  });

  it('rejects malformed and extra fields', async () => {
    const malformed = await http(app).post('/api/auth/login').send({ email: 'not-an-email', password: 'x' });
    expectError(malformed, 400, 'VALIDATION_FAILED');
    const extra = await http(app).post('/api/auth/login').send({ email: TEST_ADMIN.email, password: 'x', role: 'ADMIN' });
    expectError(extra, 400, 'VALIDATION_FAILED');
  });

  it('rotates the refresh token and forgets it after logout', async () => {
    const first = await login(TEST_ADMIN.password, '10.0.0.5').expect(200);
    const cookie = first.headers['set-cookie'] as unknown as string[];

    const refreshed = await http(app).post('/api/auth/refresh').set('Cookie', cookie).expect(200);
    const rotated = refreshed.headers['set-cookie'] as unknown as string[];
    expect((refreshed.body as { accessToken: string }).accessToken).toBeTruthy();
    expectError(await http(app).post('/api/auth/refresh').set('Cookie', cookie), 401, 'SESSION_EXPIRED');

    await http(app).post('/api/auth/logout').set('Cookie', rotated).expect(204);
    expectError(await http(app).post('/api/auth/refresh').set('Cookie', rotated), 401, 'SESSION_EXPIRED');
    expectError(await http(app).post('/api/auth/refresh'), 401, 'SESSION_EXPIRED');
  });

  it.each([
    ['get', '/api/auth/me'],
    ['get', '/api/admin/dashboard'],
    ['get', '/api/admin/residences'],
    ['get', '/api/admin/residences/7.03'],
    ['patch', '/api/admin/residences/7.03'],
    ['post', '/api/admin/residences/7.03/reserve'],
    ['post', '/api/admin/residences/7.03/release'],
    ['get', '/api/admin/enquiries'],
    ['get', '/api/admin/enquiries/1'],
    ['patch', '/api/admin/enquiries/1'],
  ] as const)('%s %s answers 401 without a valid token', async (method, path) => {
    expectError(await http(app)[method](path), 401, 'UNAUTHORIZED');
    const forged = await http(app)[method](path).set('Authorization', 'Bearer forged.token.value');
    expectError(forged, 401, 'SESSION_EXPIRED');
  });

  it('opens the admin API with a valid token', async () => {
    const token = await signIn(app);
    await http(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${token}`).expect(200);
  });
});
