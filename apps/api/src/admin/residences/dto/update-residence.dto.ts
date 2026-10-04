import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ResidenceStatus } from '../../../generated/prisma/enums.js';

export class UpdateResidenceDto {
  @IsOptional()
  @IsInt({ message: 'priceUsd must be a whole number of dollars' })
  @Min(10_000)
  @Max(10_000_000)
  priceUsd?: number;

  @IsOptional()
  @IsEnum(ResidenceStatus, { message: 'status must be AVAILABLE, RESERVED or SOLD' })
  status?: ResidenceStatus;

  /** Optional enquiry when the status is set to RESERVED from the table. */
  @IsOptional()
  @IsInt()
  @Min(1)
  enquiryId?: number;

  /** Shown in the residence history, for example "Autumn price list". */
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}
