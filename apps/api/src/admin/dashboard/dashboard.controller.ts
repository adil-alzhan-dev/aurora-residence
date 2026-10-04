import { Controller, Get } from '@nestjs/common';
import { AdminAccess } from '../../auth/admin-access.decorator.js';
import { DashboardService, type Dashboard } from './dashboard.service.js';

@Controller('admin/dashboard')
@AdminAccess()
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  summary(): Promise<Dashboard> {
    return this.dashboard.summary();
  }
}
