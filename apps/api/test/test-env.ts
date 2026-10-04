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
      'TEST_DATABASE_URL is not set. Run the tests with `pnpm --filter api test`, it starts ' +
        'a throwaway PostgreSQL in Docker and sets the URL.',
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
