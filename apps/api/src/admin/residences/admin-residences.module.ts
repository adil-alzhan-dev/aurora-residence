import { Module } from '@nestjs/common';
import { LiveModule } from '../../live/live.module.js';
import { ReservationsModule } from '../../reservations/reservations.module.js';
import { AdminResidencesController } from './admin-residences.controller.js';
import { AdminResidencesService } from './admin-residences.service.js';

@Module({
  imports: [ReservationsModule, LiveModule],
  controllers: [AdminResidencesController],
  providers: [AdminResidencesService],
})
export class AdminResidencesModule {}
