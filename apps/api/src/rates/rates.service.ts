import { Injectable } from '@nestjs/common';
import type { Currency } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface RatesResponse {
  base: 'USD';
  rates: { code: Currency; perUsd: number }[];
  updatedAt: Date | null;
}

@Injectable()
export class RatesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<RatesResponse> {
    const rows = await this.prisma.currencyRate.findMany({ orderBy: { code: 'asc' } });
    const updatedAt = rows.reduce<Date | null>(
      (latest, row) => (latest && latest > row.updatedAt ? latest : row.updatedAt),
      null,
    );
    return {
      base: 'USD',
      rates: rows.map((row) => ({ code: row.code, perUsd: row.perUsd.toNumber() })),
      updatedAt,
    };
  }
}
