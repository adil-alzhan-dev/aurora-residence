import type { ResidenceSide, ResidenceStatus } from '../../src/generated/prisma/enums.js';

export interface ResidenceSeed {
  number: string;
  floor: number;
  position: number;
  bedrooms: number;
  areaM2: string;
  isPenthouse: boolean;
  priceUsd: number;
  status: ResidenceStatus;
  layout: string;
  side: ResidenceSide;
  view: string;
}

interface PositionType {
  bedrooms: number;
  areaM2: string;
  side: ResidenceSide;
  view: string;
  floor7PriceUsd: number;
  stepPerFloorUsd: number;
}

const BASE_FLOOR = 7;
export const FLOOR_COUNT = 11;

const POSITION_TYPES: Record<number, PositionType> = {
  1: { bedrooms: 0, areaM2: '38.2', side: 'NORTH', view: 'Courtyard', floor7PriceUsd: 95_000, stepPerFloorUsd: 2_000 },
  2: { bedrooms: 1, areaM2: '51.8', side: 'NORTH', view: 'Courtyard', floor7PriceUsd: 134_000, stepPerFloorUsd: 2_000 },
  3: { bedrooms: 2, areaM2: '84.2', side: 'SOUTH', view: 'Park', floor7PriceUsd: 218_000, stepPerFloorUsd: 4_000 },
  4: { bedrooms: 2, areaM2: '87.6', side: 'SOUTH', view: 'Park', floor7PriceUsd: 226_000, stepPerFloorUsd: 4_000 },
  5: { bedrooms: 3, areaM2: '118.5', side: 'WEST', view: 'Park and city', floor7PriceUsd: 298_000, stepPerFloorUsd: 5_000 },
  6: { bedrooms: 3, areaM2: '126.3', side: 'EAST', view: 'Park and city', floor7PriceUsd: 318_000, stepPerFloorUsd: 6_000 },
};

const PENTHOUSES: Record<string, { areaM2: string; priceUsd: number }> = {
  '11.05': { areaM2: '152.4', priceUsd: 438_000 },
  '11.06': { areaM2: '164.0', priceUsd: 486_000 },
};

// A - available, R - reserved, S - sold; positions .01-.06 left to right.
const STATUS_BY_FLOOR: Record<number, string> = {
  11: 'AARASA',
  10: 'ASAARA',
  9: 'SAARAA',
  8: 'SAARSA',
  7: 'ASARAA',
  6: 'AAASAA',
  5: 'SAAARA',
  4: 'ASAASA',
  3: 'SARAAS',
  2: 'ASASAR',
  1: 'SASAAS',
};

const STATUS_CODES: Record<string, ResidenceStatus> = {
  A: 'AVAILABLE',
  R: 'RESERVED',
  S: 'SOLD',
};

export function residenceNumber(floor: number, position: number): string {
  return `${floor}.${String(position).padStart(2, '0')}`;
}

function buildResidence(floor: number, position: number): ResidenceSeed {
  const type = POSITION_TYPES[position];
  const number = residenceNumber(floor, position);
  const penthouse = PENTHOUSES[number];
  const suffix = String(position).padStart(2, '0');

  return {
    number,
    floor,
    position,
    bedrooms: type.bedrooms,
    areaM2: penthouse?.areaM2 ?? type.areaM2,
    isPenthouse: Boolean(penthouse),
    priceUsd:
      penthouse?.priceUsd ??
      type.floor7PriceUsd + type.stepPerFloorUsd * (floor - BASE_FLOOR),
    status: STATUS_CODES[STATUS_BY_FLOOR[floor][position - 1]],
    layout: penthouse ? `penthouse-${suffix}` : `type-${suffix}`,
    side: type.side,
    view: type.view,
  };
}

export function buildResidences(): ResidenceSeed[] {
  const residences: ResidenceSeed[] = [];
  for (let floor = 1; floor <= FLOOR_COUNT; floor += 1) {
    for (let position = 1; position <= 6; position += 1) {
      residences.push(buildResidence(floor, position));
    }
  }
  return residences;
}
