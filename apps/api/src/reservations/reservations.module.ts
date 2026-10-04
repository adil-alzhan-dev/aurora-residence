import { Module } from '@nestjs/common';
import { ReservationsController } from './reservations.controller.js';
import { ReservationsScheduler } from './reservations.scheduler.js';
import { ReservationsService } from './reservations.service.js';

@Module({
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationsScheduler],
  exports: [ReservationsService],
})
export class ReservationsModule {}
