import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { AREA_M2_MAX, PRICE_USD_MAX } from '../../common/number-limits.js';
import { ResidenceStatus } from '../../generated/prisma/enums.js';

export class ResidencesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(11)
  floor?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(3)
  bedrooms?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(PRICE_USD_MAX)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(PRICE_USD_MAX)
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(AREA_M2_MAX)
  minArea?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(AREA_M2_MAX)
  maxArea?: number;

  @IsOptional()
  @IsEnum(ResidenceStatus, { message: 'status must be AVAILABLE, RESERVED or SOLD' })
  status?: ResidenceStatus;
}
