import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';
import { RESIDENCE_NUMBER_PATTERN } from '../../../common/residence-number.param.js';
import { EnquiryStatus } from '../../../generated/prisma/enums.js';

// IsOptional would let null through to Prisma, so status and residenceNumber are
// skipped only when absent; managerNote: null is allowed and clears the note.
const isSent = (_: object, value: unknown) => value !== undefined;

export class UpdateEnquiryDto {
  @ValidateIf(isSent)
  @IsEnum(EnquiryStatus, { message: 'status must be NEW, IN_PROGRESS or CLOSED' })
  status?: EnquiryStatus;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(2000)
  managerNote?: string | null;

  /** Links a residence to an enquiry that came without one. */
  @ValidateIf(isSent)
  @Matches(RESIDENCE_NUMBER_PATTERN, { message: 'Residence number must look like 7.03' })
  residenceNumber?: string;
}
