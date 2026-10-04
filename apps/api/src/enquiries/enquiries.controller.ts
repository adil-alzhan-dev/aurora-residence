import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ENQUIRY_RATE_LIMIT } from '../common/throttle.js';
import { CreateEnquiryDto } from './dto/create-enquiry.dto.js';
import { EnquiriesService, type EnquiryReceipt } from './enquiries.service.js';

@Controller('enquiries')
export class EnquiriesController {
  constructor(private readonly enquiries: EnquiriesService) {}

  @Post()
  @UseGuards(ThrottlerGuard)
  @Throttle(ENQUIRY_RATE_LIMIT)
  create(@Body() dto: CreateEnquiryDto): Promise<EnquiryReceipt> {
    return this.enquiries.create(dto);
  }
}
