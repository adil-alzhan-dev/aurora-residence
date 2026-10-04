import { config } from 'dotenv';

export const TEST_ADMIN = {
  email: 'maya.collins@aurora-residence.com',
  name: 'Maya Collins',
  password: 'test-only-password',
};

/**
 * Points the app and the seed at the separate test database. Secrets and the
 * demo admin are test-only values, the real .env is used only for the URL.
 */
export function applyTestEnv(): string {
  config({ quiet: true });
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      'TEST_DATABASE_URL is not set. Add it to apps/api/.env (see .env.example) and start ' +
        'PostgreSQL: docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres',
    );
  }
  Object.assign(process.env, {
    DATABASE_URL: url,
    JWT_ACCESS_SECRET: 'test-access-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    ADMIN_EMAIL: TEST_ADMIN.email,
    ADMIN_NAME: TEST_ADMIN.name,
    ADMIN_PASSWORD: TEST_ADMIN.password,
    NODE_ENV: 'test',
  });
  return url;
}
