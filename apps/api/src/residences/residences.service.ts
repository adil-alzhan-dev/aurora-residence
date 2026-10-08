import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiError } from '../common/api-error.js';
import { ERROR_CODES } from '../common/error-codes.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ResidencesQueryDto } from './dto/residences-query.dto.js';
import {
  AVAILABLE_FIRST_ORDER,
  PUBLIC_RESIDENCE_SELECT,
  toPublicResidence,
  type PublicResidence,
} from './residence.view.js';

@Injectable()
export class ResidencesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ResidencesQueryDto): Promise<PublicResidence[]> {
    const where: Prisma.ResidenceWhereInput = {
      floor: query.floor,
      bedrooms: query.bedrooms,
      status: query.status,
      priceUsd: { gte: query.minPrice, lte: query.maxPrice },
      areaM2: { gte: query.minArea, lte: query.maxArea },
    };
    const rows = await this.prisma.residence.findMany({
      where,
      select: PUBLIC_RESIDENCE_SELECT,
      orderBy: AVAILABLE_FIRST_ORDER,
    });
    return rows.map(toPublicResidence);
  }

  async findByNumber(number: string): Promise<PublicResidence> {
    const row = await this.prisma.residence.findUnique({
      where: { number },
      select: PUBLIC_RESIDENCE_SELECT,
    });
    if (!row) throw new ApiError(HttpStatus.NOT_FOUND, ERROR_CODES.RESIDENCE_NOT_FOUND, `Residence ${number} not found`);
    return toPublicResidence(row);
  }
}
