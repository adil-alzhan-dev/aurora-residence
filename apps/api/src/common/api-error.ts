import { HttpException } from '@nestjs/common';
import type { ErrorCode } from './error-codes.js';

export interface ApiErrorBody {
  statusCode: number;
  code: ErrorCode;
  message: string | string[];
  [extra: string]: unknown;
}

/**
 * An HTTP error with a stable `code` for the client. `extra` adds fields the
 * client needs besides the code, such as attemptsLeft or errors by field.
 */
export class ApiError extends HttpException {
  constructor(status: number, code: ErrorCode, message: string | string[], extra: Record<string, unknown> = {}) {
    const body: ApiErrorBody = { statusCode: status, code, message, ...extra };
    super(body, status);
  }
}
