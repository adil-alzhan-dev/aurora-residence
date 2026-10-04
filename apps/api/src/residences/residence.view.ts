import type { Prisma } from '../generated/prisma/client.js';
import type { ResidenceSide, ResidenceStatus } from '../generated/prisma/enums.js';

/** The only residence fields the public site may see. */
export const PUBLIC_RESIDENCE_SELECT = {
  number: true,
  floor: true,
  position: true,
  bedrooms: true,
  areaM2: true,
  isPenthouse: true,
  priceUsd: true,
  status: true,
  layout: true,
  side: true,
  view: true,
} satisfies Prisma.ResidenceSelect;

type PublicResidenceRow = Prisma.ResidenceGetPayload<{ select: typeof PUBLIC_RESIDENCE_SELECT }>;

export interface PublicResidence {
  number: string;
  floor: number;
  position: number;
  bedrooms: number;
  areaM2: number;
  isPenthouse: boolean;
  priceUsd: number;
  status: ResidenceStatus;
  layout: string;
  side: ResidenceSide;
  view: string;
}

export function toPublicResidence(row: PublicResidenceRow): PublicResidence {
  return {
    number: row.number,
    floor: row.floor,
    position: row.position,
    bedrooms: row.bedrooms,
    areaM2: row.areaM2.toNumber(),
    isPenthouse: row.isPenthouse,
    priceUsd: row.priceUsd,
    status: row.status,
    layout: row.layout,
    side: row.side,
    view: row.view,
  };
}

/** "Available first": enum order in PostgreSQL is AVAILABLE, RESERVED, SOLD. */
export const AVAILABLE_FIRST_ORDER: Prisma.ResidenceOrderByWithRelationInput[] = [
  { status: 'asc' },
  { priceUsd: 'asc' },
  { floor: 'asc' },
  { position: 'asc' },
];
