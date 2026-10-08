import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { AdminAccess } from '../../auth/admin-access.decorator.js';
import type { AuthenticatedAdmin } from '../../auth/auth.types.js';
import { CurrentAdmin } from '../../auth/current-admin.decorator.js';
import { ParseIdPipe } from '../../common/parse-id.pipe.js';
import { AdminEnquiriesService } from './admin-enquiries.service.js';
import { AdminEnquiriesQueryDto } from './dto/admin-enquiries-query.dto.js';
import { UpdateEnquiryDto } from './dto/update-enquiry.dto.js';

@Controller('admin/enquiries')
@AdminAccess()
export class AdminEnquiriesController {
  constructor(private readonly enquiries: AdminEnquiriesService) {}

  @Get()
  list(@Query() query: AdminEnquiriesQueryDto) {
    return this.enquiries.list(query);
  }

  @Get(':id')
  card(@Param('id', ParseIdPipe) id: number) {
    return this.enquiries.card(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdateEnquiryDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.enquiries.update(id, dto, admin.id);
  }
}
