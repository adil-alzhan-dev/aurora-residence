import { Module } from '@nestjs/common';
import { ResidencesController } from './residences.controller.js';
import { ResidencesService } from './residences.service.js';

@Module({
  controllers: [ResidencesController],
  providers: [ResidencesService],
})
export class ResidencesModule {}
