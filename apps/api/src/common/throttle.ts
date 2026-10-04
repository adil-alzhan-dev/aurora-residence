export const MINUTE_MS = 60_000;

// Sign-in has its own limits per email and per IP in LoginThrottleService.
export const ENQUIRY_RATE_LIMIT = { default: { limit: 10, ttl: 10 * MINUTE_MS } };
