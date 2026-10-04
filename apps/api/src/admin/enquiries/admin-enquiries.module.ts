import { Module } from '@nestjs/common';
import { AdminEnquiriesController } from './admin-enquiries.controller.js';
import { AdminEnquiriesService } from './admin-enquiries.service.js';

@Module({
  controllers: [AdminEnquiriesController],
  providers: [AdminEnquiriesService],
})
export class AdminEnquiriesModule {}
