import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  PUBLIC_RESIDENCE_SELECT,
  toPublicResidence,
  type PublicResidence,
} from '../residences/residence.view.js';

export const FLOOR_COUNT = 11;

export interface FloorSummary {
  floor: number;
  total: number;
  available: number;
  fromPriceUsd: number | null;
}

export interface FloorDetails extends FloorSummary {
  residences: PublicResidence[];
}

@Injectable()
export class FloorsService {
  constructor(private readonly prisma: PrismaService) {}

  /** One row per floor for the facade hint "Floor N, X available, from $Y". */
  async summaries(): Promise<FloorSummary[]> {
    const rows = await this.prisma.residence.findMany({
      select: PUBLIC_RESIDENCE_SELECT,
      orderBy: [{ floor: 'desc' }, { position: 'asc' }],
    });
    const byFloor = new Map<number, PublicResidence[]>();
    for (const row of rows.map(toPublicResidence)) {
      byFloor.set(row.floor, [...(byFloor.get(row.floor) ?? []), row]);
    }
    return [...byFloor.entries()].map(([floor, residences]) => summarize(floor, residences));
  }

  async details(floor: number): Promise<FloorDetails> {
    const rows = await this.prisma.residence.findMany({
      where: { floor },
      select: PUBLIC_RESIDENCE_SELECT,
      orderBy: { position: 'asc' },
    });
    if (rows.length === 0) throw new NotFoundException(`Floor ${floor} not found`);
    const residences = rows.map(toPublicResidence);
    return { ...summarize(floor, residences), residences };
  }
}

function summarize(floor: number, residences: PublicResidence[]): FloorSummary {
  const availablePrices = residences
    .filter((r) => r.status === 'AVAILABLE')
    .map((r) => r.priceUsd);
  return {
    floor,
    total: residences.length,
    available: availablePrices.length,
    fromPriceUsd: availablePrices.length > 0 ? Math.min(...availablePrices) : null,
  };
}
