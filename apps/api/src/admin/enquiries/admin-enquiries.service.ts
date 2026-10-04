import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ACTIVITY_SELECT, toActivityEntry } from '../activity.view.js';
import type { AdminEnquiriesQueryDto } from './dto/admin-enquiries-query.dto.js';
import type { UpdateEnquiryDto } from './dto/update-enquiry.dto.js';

const LIST_SELECT = {
  id: true,
  name: true,
  phone: true,
  email: true,
  status: true,
  source: true,
  createdAt: true,
  residence: { select: { number: true } },
} satisfies Prisma.EnquirySelect;

const CARD_SELECT = {
  ...LIST_SELECT,
  comment: true,
  locale: true,
  currency: true,
  managerNote: true,
  updatedAt: true,
  residence: {
    select: { number: true, status: true, priceUsd: true, bedrooms: true, areaM2: true, isPenthouse: true },
  },
  reservations: {
    select: { startsAt: true, endsAt: true, releasedAt: true },
    orderBy: { startsAt: 'desc' },
  },
  activity: { select: ACTIVITY_SELECT, orderBy: { createdAt: 'desc' } },
} satisfies Prisma.EnquirySelect;

type ListRow = Prisma.EnquiryGetPayload<{ select: typeof LIST_SELECT }>;
type CardRow = Prisma.EnquiryGetPayload<{ select: typeof CARD_SELECT }>;

@Injectable()
export class AdminEnquiriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AdminEnquiriesQueryDto) {
    const where: Prisma.EnquiryWhereInput = {
      status: query.status,
      residence: query.residence ? { number: query.residence } : undefined,
      OR: query.search
        ? (['name', 'email', 'phone'] as const).map((field) => ({
            [field]: { contains: query.search, mode: 'insensitive' as const },
          }))
        : undefined,
    };
    const [rows, total] = await Promise.all([
      this.prisma.enquiry.findMany({
        where,
        select: LIST_SELECT,
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: query.offset,
      }),
      this.prisma.enquiry.count({ where }),
    ]);
    return { items: rows.map(toListItem), total };
  }

  async card(id: number) {
    const row = await this.prisma.enquiry.findUnique({ where: { id }, select: CARD_SELECT });
    if (!row) throw new NotFoundException(`Enquiry ${id} not found`);
    return toCard(row);
  }

  async update(id: number, dto: UpdateEnquiryDto, actorId: number) {
    if (dto.status === undefined && dto.managerNote === undefined) {
      throw new BadRequestException('Send a new status or managerNote');
    }
    await this.prisma.$transaction(async (tx) => {
      const current = await tx.enquiry.findUnique({
        where: { id },
        select: { status: true, managerNote: true },
      });
      if (!current) throw new NotFoundException(`Enquiry ${id} not found`);

      const statusChanged = dto.status !== undefined && dto.status !== current.status;
      const noteChanged = dto.managerNote !== undefined && dto.managerNote !== (current.managerNote ?? '');
      await tx.enquiry.update({
        where: { id },
        data: {
          status: dto.status,
          managerNote: dto.managerNote === undefined ? undefined : dto.managerNote || null,
        },
      });
      const log: Prisma.ActivityLogCreateManyInput[] = [];
      if (statusChanged) {
        log.push({ type: 'ENQUIRY_STATUS_CHANGED', enquiryId: id, actorId, fromValue: current.status, toValue: dto.status });
      }
      if (noteChanged && dto.managerNote) {
        log.push({ type: 'NOTE_ADDED', enquiryId: id, actorId, note: dto.managerNote });
      }
      if (log.length > 0) await tx.activityLog.createMany({ data: log });
    });
    return this.card(id);
  }
}

function toListItem(row: ListRow) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    status: row.status,
    source: row.source,
    residence: row.residence.number,
    createdAt: row.createdAt,
  };
}

function toCard(row: CardRow) {
  const active = row.reservations.find((r) => r.releasedAt === null) ?? null;
  return {
    ...toListItem({ ...row, residence: { number: row.residence.number } }),
    comment: row.comment,
    locale: row.locale,
    currency: row.currency,
    managerNote: row.managerNote,
    updatedAt: row.updatedAt,
    residence: { ...row.residence, areaM2: row.residence.areaM2.toNumber() },
    reservation: active ? { startsAt: active.startsAt, endsAt: active.endsAt } : null,
    activity: row.activity.map(toActivityEntry),
  };
}
