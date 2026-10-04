import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import type { ResidenceStatus } from '../../../generated/prisma/enums.js';

export const PATCHABLE_STATUSES = ['AVAILABLE', 'SOLD'] as const satisfies readonly ResidenceStatus[];

export class UpdateResidenceDto {
  @IsOptional()
  @IsInt({ message: 'priceUsd must be a whole number of dollars' })
  @Min(10_000)
  @Max(10_000_000)
  priceUsd?: number;

  @IsOptional()
  @IsIn(PATCHABLE_STATUSES, {
    message:
      'status can be AVAILABLE or SOLD here. To reserve a residence, use ' +
      'POST /api/admin/residences/:number/reserve with the enquiry of the buyer',
  })
  status?: (typeof PATCHABLE_STATUSES)[number];

  /** Shown in the residence history, for example "Autumn price list". */
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}
