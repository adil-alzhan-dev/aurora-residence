import { Transform } from 'class-transformer';
import {
  Equals,
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

export const ENQUIRY_SOURCES = ['Contacts form', 'Residence page'] as const;

// "+", then 7-15 digits (E.164 length) with optional spaces, brackets and dashes.
const PHONE_PATTERN = /^\+(?=(?:[\s()-]*\d){7,15}[\s()-]*$)[\d\s()-]+$/;

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateEnquiryDto {
  @Transform(trim)
  @IsString()
  @MinLength(2, { message: 'Enter your name' })
  @MaxLength(80)
  name!: string;

  @Transform(trim)
  @MaxLength(25)
  @Matches(PHONE_PATTERN, { message: 'Enter a phone number with country code, for example +1 555 010 2040' })
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

  @IsOptional()
  @Matches(RESIDENCE_NUMBER_PATTERN, { message: 'Residence number must look like 7.03' })
  residence?: string;

  @IsOptional()
  @IsEnum(Locale)
  locale?: Locale;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsIn(ENQUIRY_SOURCES, { message: `source must be one of: ${ENQUIRY_SOURCES.join(', ')}` })
  source!: (typeof ENQUIRY_SOURCES)[number];

  @Equals(true, { message: 'Please confirm you agree to be contacted' })
  consent!: true;

  /** Honeypot: hidden from people, filled in by bots. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  website?: string;
}
