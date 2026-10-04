import type { INestApplication } from '@nestjs/common';
import { createTestApp, http, reseed, signIn } from './app.js';
import { TEST_ADMIN } from './test-env.js';

interface ErrorBody {
  message: string;
  attemptsLeft?: number;
  retryAfterSeconds?: number;
}

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
    expect(me.body).toMatchObject({ email: TEST_ADMIN.email, name: TEST_ADMIN.name, role: 'ADMIN' });
    expect(Object.keys(me.body as object).sort()).toEqual(['email', 'id', 'name', 'role']);
  });

  it('counts down attempts and locks email + IP for 15 minutes after 5 failures', async () => {
    const ip = '10.0.0.2';
    for (const left of [4, 3, 2, 1]) {
      const response = await login('wrong-password', ip).expect(401);
      const body = response.body as ErrorBody;
      expect(body.attemptsLeft).toBe(left);
      expect(body.message).toContain(`Wrong email or password. ${left} attempt`);
    }
    const fifth = await login('wrong-password', ip).expect(429);
    expect((fifth.body as ErrorBody).retryAfterSeconds).toBe(900);

    const locked = await login(TEST_ADMIN.password, ip).expect(429);
    expect((locked.body as ErrorBody).message).toMatch(/try again in 15 minutes/);

    // Another IP is not affected by the lock.
    await login(TEST_ADMIN.password, '10.0.0.3').expect(200);
  });

  it('does not reveal whether the email exists', async () => {
    const response = await http(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '10.0.0.4')
      .send({ email: 'nobody@example.com', password: 'whatever' })
      .expect(401);
    expect((response.body as ErrorBody).message).toContain('Wrong email or password. 4 attempts left');
  });

  it('rejects malformed and extra fields', async () => {
    await http(app).post('/api/auth/login').send({ email: 'not-an-email', password: 'x' }).expect(400);
    await http(app)
      .post('/api/auth/login')
      .send({ email: TEST_ADMIN.email, password: 'x', role: 'ADMIN' })
      .expect(400);
  });

  it('rotates the refresh token and forgets it after logout', async () => {
    const first = await login(TEST_ADMIN.password, '10.0.0.5').expect(200);
    const cookie = first.headers['set-cookie'] as unknown as string[];

    const refreshed = await http(app).post('/api/auth/refresh').set('Cookie', cookie).expect(200);
    const rotated = refreshed.headers['set-cookie'] as unknown as string[];
    expect((refreshed.body as { accessToken: string }).accessToken).toBeTruthy();
    await http(app).post('/api/auth/refresh').set('Cookie', cookie).expect(401);

    await http(app).post('/api/auth/logout').set('Cookie', rotated).expect(204);
    await http(app).post('/api/auth/refresh').set('Cookie', rotated).expect(401);
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
    await http(app)[method](path).expect(401);
    await http(app)[method](path).set('Authorization', 'Bearer forged.token.value').expect(401);
  });

  it('opens the admin API with a valid token', async () => {
    const token = await signIn(app);
    await http(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${token}`).expect(200);
  });
});
