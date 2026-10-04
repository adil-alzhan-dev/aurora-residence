import { Controller, Get, Param } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { FLOOR_COUNT, FloorsService, type FloorDetails, type FloorSummary } from './floors.service.js';

class FloorParam {
  @Type(() => Number)
  @IsInt({ message: 'Floor must be a whole number' })
  @Min(1, { message: `Floor must be between 1 and ${FLOOR_COUNT}` })
  @Max(FLOOR_COUNT, { message: `Floor must be between 1 and ${FLOOR_COUNT}` })
  n!: number;
}

@Controller('floors')
export class FloorsController {
  constructor(private readonly floors: FloorsService) {}

  @Get()
  list(): Promise<FloorSummary[]> {
    return this.floors.summaries();
  }

  @Get(':n')
  findOne(@Param() params: FloorParam): Promise<FloorDetails> {
    return this.floors.details(params.n);
  }
}
