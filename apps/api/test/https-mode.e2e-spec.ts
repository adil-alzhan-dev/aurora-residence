import type { INestApplication } from '@nestjs/common';
import { createTestApp, http, reseed } from './app.js';
import { TEST_ADMIN } from './test-env.js';

describe('HTTPS_ENABLED=true (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    reseed();
    process.env.HTTPS_ENABLED = 'true';
    app = await createTestApp();
  });

  afterAll(async () => {
    delete process.env.HTTPS_ENABLED;
    await app.close();
  });

  it('marks the refresh cookie Secure and sends HSTS', async () => {
    const response = await http(app)
      .post('/api/auth/login')
      .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password })
      .expect(200);
    expect(String(response.headers['set-cookie'])).toMatch(/; Secure/);
    expect(response.headers['strict-transport-security']).toMatch(/max-age=\d+/);
  });

  it('sends neither without HTTPS_ENABLED', async () => {
    delete process.env.HTTPS_ENABLED;
    const plain = await createTestApp();
    try {
      const response = await http(plain)
        .post('/api/auth/login')
        .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password })
        .expect(200);
      expect(String(response.headers['set-cookie'])).not.toMatch(/Secure/);
      expect(response.headers['strict-transport-security']).toBeUndefined();
    } finally {
      await plain.close();
    }
  });
});
