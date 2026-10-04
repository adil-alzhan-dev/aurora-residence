import { Controller, Get, Param, Query } from '@nestjs/common';
import { ResidenceNumberParam } from '../common/residence-number.param.js';
import { ResidencesQueryDto } from './dto/residences-query.dto.js';
import type { PublicResidence } from './residence.view.js';
import { ResidencesService } from './residences.service.js';

@Controller('residences')
export class ResidencesController {
  constructor(private readonly residences: ResidencesService) {}

  @Get()
  list(@Query() query: ResidencesQueryDto): Promise<PublicResidence[]> {
    return this.residences.list(query);
  }

  @Get(':number')
  findOne(@Param() params: ResidenceNumberParam): Promise<PublicResidence> {
    return this.residences.findByNumber(params.number);
  }
}
