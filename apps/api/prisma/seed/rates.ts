import type { Currency } from '../../src/generated/prisma/enums.js';

/** Fixed demo rates: units of the currency per one US dollar. No paid rate APIs. */
export const CURRENCY_RATES: { code: Currency; perUsd: string }[] = [
  { code: 'USD', perUsd: '1.0000' },
  { code: 'EUR', perUsd: '0.9200' },
  { code: 'KZT', perUsd: '505.0000' },
];
