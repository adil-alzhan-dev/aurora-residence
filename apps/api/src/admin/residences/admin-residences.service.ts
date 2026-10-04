import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import type { ResidenceStatus } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ReservationsService, type ActiveReservation } from '../../reservations/reservations.service.js';
import { PUBLIC_RESIDENCE_SELECT, toPublicResidence, type PublicResidence } from '../../residences/residence.view.js';
import { ACTIVITY_SELECT, toActivityEntry, type ActivityEntry } from '../activity.view.js';
import type { AdminResidencesQueryDto } from './dto/admin-residences-query.dto.js';
import type { UpdateResidenceDto } from './dto/update-residence.dto.js';

const ADMIN_RESIDENCE_SELECT = {
  ...PUBLIC_RESIDENCE_SELECT,
  id: true,
  statusChangedAt: true,
  reservations: { where: { releasedAt: null }, select: { endsAt: true }, take: 1 },
} satisfies Prisma.ResidenceSelect;

type AdminResidenceRow = Prisma.ResidenceGetPayload<{ select: typeof ADMIN_RESIDENCE_SELECT }>;

export interface AdminResidence extends PublicResidence {
  statusChangedAt: Date;
  reservedUntil: Date | null;
}

export interface AdminResidenceList {
  items: AdminResidence[];
  counts: Record<ResidenceStatus, number>;
}

export interface AdminResidenceCard extends AdminResidence {
  reservation: ActiveReservation | null;
  history: ActivityEntry[];
}

@Injectable()
export class AdminResidencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reservations: ReservationsService,
  ) {}

  async list(query: AdminResidencesQueryDto): Promise<AdminResidenceList> {
    const rows = await this.prisma.residence.findMany({
      where: {
        number: query.search ? { contains: query.search } : undefined,
        floor: query.floor,
        bedrooms: query.bedrooms,
        status: query.status,
        priceUsd: { gte: query.minPrice, lte: query.maxPrice },
        areaM2: { gte: query.minArea, lte: query.maxArea },
      },
      select: ADMIN_RESIDENCE_SELECT,
      orderBy: [{ floor: 'desc' }, { position: 'asc' }],
    });
    const counts = { AVAILABLE: 0, RESERVED: 0, SOLD: 0 };
    for (const row of rows) counts[row.status] += 1;
    return { items: rows.map(toAdminResidence), counts };
  }

  async card(number: string): Promise<AdminResidenceCard> {
    const row = await this.prisma.residence.findUnique({
      where: { number },
      select: {
        ...ADMIN_RESIDENCE_SELECT,
        activity: { select: ACTIVITY_SELECT, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!row) throw new NotFoundException(`Residence ${number} not found`);
    return {
      ...toAdminResidence(row),
      reservation: await this.reservations.activeReservation(row.id),
      history: row.activity.map(toActivityEntry),
    };
  }

  async update(number: string, dto: UpdateResidenceDto, actorId: number): Promise<AdminResidenceCard> {
    if (dto.priceUsd === undefined && dto.status === undefined) {
      throw new BadRequestException('Send a new priceUsd or status');
    }
    await this.prisma.$transaction(async (tx) => {
      const current = await tx.residence.findUnique({
        where: { number },
        select: { id: true, priceUsd: true },
      });
      if (!current) throw new NotFoundException(`Residence ${number} not found`);

      if (dto.priceUsd !== undefined && dto.priceUsd !== current.priceUsd) {
        await tx.residence.update({ where: { id: current.id }, data: { priceUsd: dto.priceUsd } });
        await tx.activityLog.create({
          data: {
            type: 'PRICE_CHANGED',
            residenceId: current.id,
            fromValue: String(current.priceUsd),
            toValue: String(dto.priceUsd),
            actorId,
            note: dto.note ?? 'Price updated',
          },
        });
      }
      if (dto.status !== undefined) {
        await this.reservations.changeStatus(tx, { number, to: dto.status, actorId, note: dto.note });
      }
    });
    return this.card(number);
  }
}

function toAdminResidence(row: AdminResidenceRow): AdminResidence {
  return {
    ...toPublicResidence(row),
    statusChangedAt: row.statusChangedAt,
    reservedUntil: row.reservations[0]?.endsAt ?? null,
  };
}
