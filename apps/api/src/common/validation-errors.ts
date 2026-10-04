import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

/**
 * Keeps the default 400 body ({ statusCode, error, message: string[] }) and adds
 * `errors`: the first message for each field, so forms can show it next to the input.
 */
export function validationExceptionFactory(validationErrors: ValidationError[]): BadRequestException {
  const messages: string[] = [];
  const errors: Record<string, string> = {};
  collect(validationErrors, '', messages, errors);
  return new BadRequestException({
    statusCode: 400,
    error: 'Bad Request',
    message: messages,
    errors,
  });
}

function collect(
  validationErrors: ValidationError[],
  parentPath: string,
  messages: string[],
  errors: Record<string, string>,
): void {
  for (const error of validationErrors) {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;
    const fieldMessages = Object.values(error.constraints ?? {});
    messages.push(...fieldMessages);
    if (fieldMessages.length > 0 && !(path in errors)) errors[path] = fieldMessages[0];
    if (error.children?.length) collect(error.children, path, messages, errors);
  }
}
