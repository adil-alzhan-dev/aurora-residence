export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Environment variable ${name} is required`);
  return value;
}

/**
 * HTTPS_ENABLED=true turns on everything that only works over https: the Secure
 * cookie flag and HSTS. Off by default so a production build can be shown on
 * http://localhost.
 */
export function isHttpsEnabled(): boolean {
  return process.env.HTTPS_ENABLED === 'true';
}
