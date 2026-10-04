export const MINUTE_MS = 60_000;

/** Per-IP request limits; the sign-in lockout per email and IP is separate. */
export const LOGIN_RATE_LIMIT = { default: { limit: 20, ttl: MINUTE_MS } };
export const ENQUIRY_RATE_LIMIT = { default: { limit: 10, ttl: 10 * MINUTE_MS } };
