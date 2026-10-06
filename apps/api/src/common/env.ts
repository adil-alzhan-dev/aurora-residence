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

const DEFAULT_WS_ALLOWED_ORIGINS = ['http://localhost'];

/**
 * Browser origins allowed to open the live WebSocket, from WS_ALLOWED_ORIGINS
 * (comma separated). Every entry must be a bare origin such as https://example.com,
 * a typo here would silently lock the site out of live updates.
 */
export function wsAllowedOrigins(): string[] {
  const raw = process.env.WS_ALLOWED_ORIGINS?.trim();
  if (!raw) return DEFAULT_WS_ALLOWED_ORIGINS;
  return raw.split(',').map((entry) => {
    const origin = entry.trim();
    if (!URL.canParse(origin) || new URL(origin).origin !== origin) {
      throw new Error(
        `WS_ALLOWED_ORIGINS has "${origin}", expected an origin like https://example.com without a path or trailing slash`,
      );
    }
    return origin;
  });
}
