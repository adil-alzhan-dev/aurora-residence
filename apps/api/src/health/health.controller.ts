import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
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
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'down',
        message: 'Database is unreachable',
      });
    }
    return { status: 'ok', database: 'ok' };
  }
}
