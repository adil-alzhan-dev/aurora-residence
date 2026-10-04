import { Injectable } from '@nestjs/common';
import type { EnquiryStatus, ResidenceStatus } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';

const EXPIRING_WITHIN_MS = 48 * 60 * 60 * 1000;

export interface Dashboard {
  residences: Record<ResidenceStatus, number> & { total: number };
  enquiries: { total: number; newToday: number; byStatus: Record<EnquiryStatus, number> };
  expiringReservations: { residence: string; endsAt: Date; client: string | null }[];
  latestEnquiries: {
    id: number;
    name: string;
    residence: string | null;
    status: EnquiryStatus;
    createdAt: Date;
  }[];
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(now = new Date()): Promise<Dashboard> {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [residenceGroups, enquiryGroups, newToday, expiring, latest] = await Promise.all([
      this.prisma.residence.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.enquiry.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.enquiry.count({ where: { createdAt: { gte: startOfToday } } }),
      this.prisma.reservation.findMany({
        where: { releasedAt: null, endsAt: { lte: new Date(now.getTime() + EXPIRING_WITHIN_MS) } },
        orderBy: { endsAt: 'asc' },
        select: {
          endsAt: true,
          residence: { select: { number: true } },
          enquiry: { select: { name: true } },
        },
      }),
      this.prisma.enquiry.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          residence: { select: { number: true } },
        },
      }),
    ]);

    const residences = { AVAILABLE: 0, RESERVED: 0, SOLD: 0, total: 0 };
    for (const group of residenceGroups) {
      residences[group.status] = group._count._all;
      residences.total += group._count._all;
    }
    const byStatus = { NEW: 0, IN_PROGRESS: 0, CLOSED: 0 };
    for (const group of enquiryGroups) byStatus[group.status] = group._count._all;

    return {
      residences,
      enquiries: {
        total: byStatus.NEW + byStatus.IN_PROGRESS + byStatus.CLOSED,
        newToday,
        byStatus,
      },
      expiringReservations: expiring.map((r) => ({
        residence: r.residence.number,
        endsAt: r.endsAt,
        client: r.enquiry?.name ?? null,
      })),
      latestEnquiries: latest.map((e) => ({
        id: e.id,
        name: e.name,
        residence: e.residence?.number ?? null,
        status: e.status,
        createdAt: e.createdAt,
      })),
    };
  }
}
