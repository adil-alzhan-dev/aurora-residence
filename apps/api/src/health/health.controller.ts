import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiError } from '../common/api-error.js';
import { ERROR_CODES } from '../common/error-codes.js';
import { HealthService } from './health.service.js';

export interface HealthStatus {
  status: 'ok';
  database: 'ok';
}

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  async check(): Promise<HealthStatus> {
    if (!(await this.health.isDatabaseUp())) {
      throw new ApiError(HttpStatus.SERVICE_UNAVAILABLE, ERROR_CODES.SERVICE_UNAVAILABLE, 'Database is unreachable', {
        status: 'error',
        database: 'down',
      });
    }
    return { status: 'ok', database: 'ok' };
  }
}
