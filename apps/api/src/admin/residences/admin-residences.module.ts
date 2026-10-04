import { Module } from '@nestjs/common';
import { ReservationsModule } from '../../reservations/reservations.module.js';
import { AdminResidencesController } from './admin-residences.controller.js';
import { AdminResidencesService } from './admin-residences.service.js';

@Module({
  imports: [ReservationsModule],
  controllers: [AdminResidencesController],
  providers: [AdminResidencesService],
})
export class AdminResidencesModule {}
