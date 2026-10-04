import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
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
}
