import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import type { ResidenceStatus } from '../../../generated/prisma/enums.js';

export const PATCHABLE_STATUSES = ['AVAILABLE', 'SOLD'] as const satisfies readonly ResidenceStatus[];

// IsOptional would let null through to Prisma, so priceUsd and status are skipped
// only when absent; note: null is harmless and falls back to the default note.
const isSent = (_: object, value: unknown) => value !== undefined;

export class UpdateResidenceDto {
  // Decorators run bottom-up, so a wrong type is reported before the range.
  @ValidateIf(isSent)
  @Min(10_000)
  @Max(10_000_000)
  @IsInt({ message: 'priceUsd must be a whole number of dollars' })
  priceUsd?: number;

  @ValidateIf(isSent)
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
