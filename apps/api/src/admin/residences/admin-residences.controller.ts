import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { AdminAccess } from '../../auth/admin-access.decorator.js';
import type { AuthenticatedAdmin } from '../../auth/auth.types.js';
import { CurrentAdmin } from '../../auth/current-admin.decorator.js';
import { ResidenceNumberParam } from '../../common/residence-number.param.js';
import {
  AdminResidencesService,
  type AdminResidenceCard,
  type AdminResidenceList,
} from './admin-residences.service.js';
import { AdminResidencesQueryDto } from './dto/admin-residences-query.dto.js';
import { UpdateResidenceDto } from './dto/update-residence.dto.js';

@Controller('admin/residences')
@AdminAccess()
export class AdminResidencesController {
  constructor(private readonly residences: AdminResidencesService) {}

  @Get()
  list(@Query() query: AdminResidencesQueryDto): Promise<AdminResidenceList> {
    return this.residences.list(query);
  }

  @Get(':number')
  card(@Param() params: ResidenceNumberParam): Promise<AdminResidenceCard> {
    return this.residences.card(params.number);
  }

  @Patch(':number')
  update(
    @Param() params: ResidenceNumberParam,
    @Body() dto: UpdateResidenceDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ): Promise<AdminResidenceCard> {
    return this.residences.update(params.number, dto, admin.id);
  }
}
