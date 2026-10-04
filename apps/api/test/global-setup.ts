import { execFileSync } from 'node:child_process';
import { Client } from 'pg';
import { config } from 'dotenv';

/**
 * Creates the test database if needed and applies the Prisma migrations.
 * Jest loads this file outside the test runtime, so it cannot import test-env.ts.
 */
export default async function globalSetup(): Promise<void> {
  config({ quiet: true });
  if (!process.env.TEST_DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL is not set, see apps/api/.env and .env.example');
  }
  const url = new URL(process.env.TEST_DATABASE_URL);
  const database = url.pathname.slice(1);
  if (!/^\w+$/.test(database) || !database.endsWith('_test')) {
    throw new Error(`TEST_DATABASE_URL must point to a database named *_test, got "${database}"`);
  }

  const adminUrl = new URL(url);
  adminUrl.pathname = '/postgres';
  adminUrl.search = '';
  const client = new Client({ connectionString: adminUrl.toString() });
  await client.connect();
  try {
    const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
    // The name is checked against /^\w+$/ above; CREATE DATABASE cannot take a parameter.
    if (exists.rowCount === 0) await client.query(`CREATE DATABASE "${database}"`);
  } finally {
    await client.end();
  }

  execFileSync('node_modules/.bin/prisma', ['migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: url.toString() },
    stdio: 'ignore',
  });
}
