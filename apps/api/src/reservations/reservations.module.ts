import { Module } from '@nestjs/common';
import { LiveModule } from '../live/live.module.js';
import { ReservationsController } from './reservations.controller.js';
import { ReservationsScheduler } from './reservations.scheduler.js';
import { ReservationsService } from './reservations.service.js';

@Module({
  imports: [LiveModule],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationsScheduler],
  exports: [ReservationsService],
})
export class ReservationsModule {}
