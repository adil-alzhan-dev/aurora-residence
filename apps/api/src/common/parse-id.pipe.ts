import { type ArgumentMetadata, HttpStatus, Injectable, type PipeTransform } from '@nestjs/common';
import { ApiError } from './api-error.js';
import { ERROR_CODES } from './error-codes.js';
import { DB_INT_MAX } from './number-limits.js';

/**
 * A path id that fits the Int column, checked before it reaches Prisma. The
 * global ValidationPipe has already turned the string into a number by now.
 */
@Injectable()
export class ParseIdPipe implements PipeTransform<unknown, number> {
  transform(value: unknown, metadata: ArgumentMetadata): number {
    const id = Number(value);
    if (Number.isInteger(id) && id >= 1 && id <= DB_INT_MAX) return id;
    const field = metadata.data ?? 'id';
    const message = `${field} must be a whole number from 1 to ${DB_INT_MAX}`;
    throw new ApiError(HttpStatus.BAD_REQUEST, ERROR_CODES.VALIDATION_FAILED, [message], {
      errors: { [field]: message },
    });
  }
}
