import { Controller, Get } from '@nestjs/common';
import { RatesService, type RatesResponse } from './rates.service.js';

@Controller('rates')
export class RatesController {
  constructor(private readonly rates: RatesService) {}

  @Get()
  list(): Promise<RatesResponse> {
    return this.rates.list();
  }
}
