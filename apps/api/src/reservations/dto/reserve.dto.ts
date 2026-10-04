import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ReserveDto {
  @IsInt({ message: 'enquiryId must be the id of an enquiry' })
  @Min(1)
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
