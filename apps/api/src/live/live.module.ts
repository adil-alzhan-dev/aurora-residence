import { Module } from '@nestjs/common';
import { LiveGateway } from './live.gateway.js';
import { LiveService } from './live.service.js';

@Module({
  providers: [LiveGateway, LiveService],
  exports: [LiveService],
})
export class LiveModule {}
