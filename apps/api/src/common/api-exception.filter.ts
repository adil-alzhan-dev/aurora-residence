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
  [HttpStatus.SERVICE_UNAVAILABLE]: ERROR_CODES.SERVICE_UNAVAILABLE,
};

const INTERNAL_ERROR: ApiErrorBody = {
  statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  code: ERROR_CODES.INTERNAL_ERROR,
  message: 'Internal server error',
};

/**
 * Gives every HTTP error the same body: { statusCode, code, message } plus the
 * extra fields an ApiError carries. Headers set before the throw (Retry-After
 * from the throttler) stay on the response. Server errors other than 503 never
 * show their details to the client, only to the log.
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

  private toBody(exception: unknown): ApiErrorBody {
    const status: number = exception instanceof HttpException ? exception.getStatus() : 500;
    if (!(exception instanceof HttpException) || (status >= 500 && status !== 503)) {
      const error = exception instanceof Error ? exception : new Error(String(exception));
      this.logger.error(error.message, error.stack);
      return INTERNAL_ERROR;
    }
    const payload = exception.getResponse();
    if (hasErrorCode(payload)) return payload;
    return {
      statusCode: status,
      code: CODE_BY_STATUS[status] ?? ERROR_CODES.BAD_REQUEST,
      message: messageOf(payload, exception),
    };
  }
}

function hasErrorCode(payload: unknown): payload is ApiErrorBody {
  const code = (payload as { code?: unknown } | null)?.code;
  return typeof code === 'string' && (ALL_ERROR_CODES as string[]).includes(code);
}

function messageOf(payload: unknown, exception: HttpException): string | string[] {
  if (typeof payload === 'string') return payload;
  const message = (payload as { message?: unknown } | null)?.message;
  if (typeof message === 'string') return message;
  if (Array.isArray(message) && message.every((item) => typeof item === 'string')) return message;
  return exception.message;
}
