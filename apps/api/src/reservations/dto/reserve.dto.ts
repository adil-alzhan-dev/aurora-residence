import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { DB_INT_MAX } from '../../common/number-limits.js';

export class ReserveDto {
  @IsInt({ message: 'enquiryId must be the id of an enquiry' })
  @Min(1)
  @Max(DB_INT_MAX)
  enquiryId!: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}

export class ReleaseDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}
