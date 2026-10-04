import { Matches } from 'class-validator';

export const RESIDENCE_NUMBER_PATTERN = /^(1[01]|[1-9])\.0[1-6]$/;

export class ResidenceNumberParam {
  @Matches(RESIDENCE_NUMBER_PATTERN, {
    message: 'Residence number must look like 7.03 (floor 1-11, position 01-06)',
  })
  number!: string;
}
