import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { RESIDENCE_NUMBER_PATTERN } from '../../common/residence-number.param.js';
import { Currency, Locale } from '../../generated/prisma/enums.js';

export const ENQUIRY_SOURCES = [
  'Residence page, Send request',
  'Floor plan, Enquire',
  'Contacts form',
] as const;

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateEnquiryDto {
  @Transform(trim)
  @IsString()
  @MinLength(2, { message: 'Enter your name' })
  @MaxLength(80)
  name!: string;

  @Transform(trim)
  @Matches(/^\+?[\d\s()-]{7,25}$/, { message: 'Enter a phone number with country code' })
  phone!: string;

  @Transform(trim)
  @IsEmail({}, { message: 'Enter a valid email address' })
  @MaxLength(254)
  email!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  comment?: string;

  @Matches(RESIDENCE_NUMBER_PATTERN, { message: 'Residence number must look like 7.03' })
  residence!: string;

  @IsOptional()
  @IsEnum(Locale)
  locale?: Locale;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsOptional()
  @IsIn(ENQUIRY_SOURCES)
  source?: (typeof ENQUIRY_SOURCES)[number];

  /** Honeypot: hidden from people, filled in by bots. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  website?: string;
}
