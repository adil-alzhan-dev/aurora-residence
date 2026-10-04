import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import { AdminAccess } from '../auth/admin-access.decorator.js';
import type { AuthenticatedAdmin } from '../auth/auth.types.js';
import { CurrentAdmin } from '../auth/current-admin.decorator.js';
import { ResidenceNumberParam } from '../common/residence-number.param.js';
import { ReleaseDto, ReserveDto } from './dto/reserve.dto.js';
import { ReservationsService, type ResidenceReservationState } from './reservations.service.js';

@Controller('admin/residences/:number')
@AdminAccess()
export class ReservationsController {
  constructor(private readonly reservations: ReservationsService) {}

  @Post('reserve')
  reserve(
    @Param() params: ResidenceNumberParam,
    @Body() dto: ReserveDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ): Promise<ResidenceReservationState> {
    return this.reservations.reserve(params.number, dto.enquiryId, admin.id, dto.note);
  }

  @Post('release')
  @HttpCode(200)
  release(
    @Param() params: ResidenceNumberParam,
    @Body() dto: ReleaseDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ): Promise<ResidenceReservationState> {
    return this.reservations.release(params.number, admin.id, dto.note);
  }
}
