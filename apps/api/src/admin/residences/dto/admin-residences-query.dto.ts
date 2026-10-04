import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ResidencesQueryDto } from '../../../residences/dto/residences-query.dto.js';

export class AdminResidencesQueryDto extends ResidencesQueryDto {
  /** Part of the residence number, for example "7." or "03". */
  @IsOptional()
  @IsString()
  @MaxLength(10)
  search?: string;
}
