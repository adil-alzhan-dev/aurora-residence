import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';
import type { ApiErrorBody } from './api-error.js';
import { ALL_ERROR_CODES, ERROR_CODES, type ErrorCode } from './error-codes.js';

const CODE_BY_STATUS: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: ERROR_CODES.BAD_REQUEST,
  [HttpStatus.UNAUTHORIZED]: ERROR_CODES.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ERROR_CODES.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ERROR_CODES.NOT_FOUND,
  [HttpStatus.CONFLICT]: ERROR_CODES.CONFLICT,
  [HttpStatus.PAYLOAD_TOO_LARGE]: ERROR_CODES.PAYLOAD_TOO_LARGE,
  [HttpStatus.TOO_MANY_REQUESTS]: ERROR_CODES.RATE_LIMITED,
};

const INTERNAL_ERROR: ApiErrorBody = {
  statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  code: ERROR_CODES.INTERNAL_ERROR,
  message: 'Internal server error',
};

const SERVICE_UNAVAILABLE: ApiErrorBody = {
  statusCode: HttpStatus.SERVICE_UNAVAILABLE,
  code: ERROR_CODES.SERVICE_UNAVAILABLE,
  message: 'Service temporarily unavailable',
};

// What the health check adds to a 503 when the database is down; any other value is dropped.
const HEALTH_DOWN = { status: 'error', database: 'down' } as const;

const CLIENT_ERROR_EXTRAS = ['errors', 'attemptsLeft', 'retryAfterSeconds'] as const;

/**
 * Gives every HTTP error the same body: { statusCode, code, message }. A 4xx may
 * add only the fields in CLIENT_ERROR_EXTRAS. A 5xx answers with a fixed text by
 * its code and never shows its details or payload to the client, only to the log;
 * the one exception is the health check's constant HEALTH_DOWN fields on a 503.
 * Headers set before the throw (Retry-After from the throttler) stay on the response.
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ApiExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const body = this.toBody(exception);
    if (response.headersSent) {
      response.end();
      return;
    }
    response.status(body.statusCode).json(body);
  }

  private toBody(error: unknown): ApiErrorBody {
    const exception = isClientHttpError(error) ? new HttpException(error.message, error.status) : error;
    const status: HttpStatus =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    if (!(exception instanceof HttpException) || status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logServerError(exception);
      const isUnavailable = exception instanceof HttpException && status === HttpStatus.SERVICE_UNAVAILABLE;
      return isUnavailable ? serviceUnavailableBody(exception) : INTERNAL_ERROR;
    }
    const payload = exception.getResponse();
    return {
      statusCode: status,
      code: errorCodeOf(payload) ?? CODE_BY_STATUS[status] ?? ERROR_CODES.BAD_REQUEST,
      message: messageOf(payload, exception),
      ...allowedExtras(payload),
    };
  }

  private logServerError(exception: unknown): void {
    const error = exception instanceof Error ? exception : new Error(String(exception));
    this.logger.error(error.message, error.stack);
  }
}

/**
 * Express middleware (the JSON body parser) reports a too large body as a plain
 * error with status 413 and expose: true; it is the client's mistake, not a 500.
 */
function isClientHttpError(error: unknown): error is Error & { status: number } {
  if (!(error instanceof Error)) return false;
  const { status, expose } = error as { status?: unknown; expose?: unknown };
  return expose === true && typeof status === 'number' && status >= 400 && status < 500;
}

function serviceUnavailableBody(exception: HttpException): ApiErrorBody {
  const payload = exception.getResponse();
  const isHealthDown =
    typeof payload === 'object' &&
    payload !== null &&
    'status' in payload &&
    'database' in payload &&
    payload.status === HEALTH_DOWN.status &&
    payload.database === HEALTH_DOWN.database;
  return isHealthDown ? { ...SERVICE_UNAVAILABLE, ...HEALTH_DOWN } : SERVICE_UNAVAILABLE;
}

function errorCodeOf(payload: unknown): ErrorCode | undefined {
  const code = (payload as { code?: unknown } | null)?.code;
  if (typeof code !== 'string' || !(ALL_ERROR_CODES as string[]).includes(code)) return undefined;
  return code as ErrorCode;
}

function allowedExtras(payload: unknown): Record<string, unknown> {
  if (typeof payload !== 'object' || payload === null) return {};
  const extras: Record<string, unknown> = {};
  for (const field of CLIENT_ERROR_EXTRAS) {
    const value = (payload as Record<string, unknown>)[field];
    if (value !== undefined) extras[field] = value;
  }
  return extras;
}

function messageOf(payload: unknown, exception: HttpException): string | string[] {
  if (typeof payload === 'string') return payload;
  const message = (payload as { message?: unknown } | null)?.message;
  if (typeof message === 'string') return message;
  if (Array.isArray(message) && message.every((item) => typeof item === 'string')) return message;
  return exception.message;
}
