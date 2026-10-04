import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { RESIDENCE_NUMBER_PATTERN } from '../../../common/residence-number.param.js';
import { EnquiryStatus } from '../../../generated/prisma/enums.js';

export class AdminEnquiriesQueryDto {
  /** Matches client name, email or phone. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsEnum(EnquiryStatus, { message: 'status must be NEW, IN_PROGRESS or CLOSED' })
  status?: EnquiryStatus;

  @IsOptional()
  @Matches(RESIDENCE_NUMBER_PATTERN, { message: 'Residence number must look like 7.03' })
  residence?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset = 0;
}
