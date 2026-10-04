import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { RESIDENCE_NUMBER_PATTERN } from '../../../common/residence-number.param.js';
import { EnquiryStatus } from '../../../generated/prisma/enums.js';

export class UpdateEnquiryDto {
  @IsOptional()
  @IsEnum(EnquiryStatus, { message: 'status must be NEW, IN_PROGRESS or CLOSED' })
  status?: EnquiryStatus;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(2000)
  managerNote?: string;

  /** Links a residence to an enquiry that came without one. */
  @IsOptional()
  @Matches(RESIDENCE_NUMBER_PATTERN, { message: 'Residence number must look like 7.03' })
  residenceNumber?: string;
}
