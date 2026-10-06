import { Injectable } from '@nestjs/common';
import type { EnquiryStatus, ResidenceStatus } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';

const ENDING_SOON_MS = 48 * 60 * 60 * 1000;
const LATEST_ENQUIRIES = 5;

export interface DashboardReservation {
  residence: string;
  client: string | null;
  expiresAt: Date;
  endingSoon: boolean;
}

export interface DashboardEnquiry {
  id: number;
  createdAt: Date;
  name: string;
  email: string;
  phone: string;
  status: EnquiryStatus;
  source: string;
  residence: { number: string; bedrooms: number; areaM2: number; priceUsd: number } | null;
}

export interface Dashboard {
  residences: Record<ResidenceStatus, number> & { total: number };
  enquiries: { total: number; new: number; newToday: number };
  facade: { number: string; status: ResidenceStatus }[];
  reservations: DashboardReservation[];
  latestEnquiries: DashboardEnquiry[];
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(now = new Date()): Promise<Dashboard> {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [facade, enquiryTotal, newCount, newToday, reservations, latest] = await Promise.all([
      this.prisma.residence.findMany({
        orderBy: [{ floor: 'asc' }, { position: 'asc' }],
        select: { number: true, status: true },
      }),
      this.prisma.enquiry.count(),
      this.prisma.enquiry.count({ where: { status: 'NEW' } }),
      this.prisma.enquiry.count({ where: { createdAt: { gte: startOfToday } } }),
      this.prisma.reservation.findMany({
        where: { releasedAt: null },
        orderBy: { endsAt: 'asc' },
        select: {
          endsAt: true,
          residence: { select: { number: true } },
          enquiry: { select: { name: true } },
        },
      }),
      this.prisma.enquiry.findMany({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: LATEST_ENQUIRIES,
        select: {
          id: true,
          createdAt: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          source: true,
          residence: { select: { number: true, bedrooms: true, areaM2: true, priceUsd: true } },
        },
      }),
    ]);

    const residences = { AVAILABLE: 0, RESERVED: 0, SOLD: 0, total: facade.length };
    for (const residence of facade) residences[residence.status] += 1;
    const endingSoonBefore = now.getTime() + ENDING_SOON_MS;

    return {
      residences,
      enquiries: { total: enquiryTotal, new: newCount, newToday },
      facade,
      reservations: reservations.map((reservation) => ({
        residence: reservation.residence.number,
        client: reservation.enquiry?.name ?? null,
        expiresAt: reservation.endsAt,
        endingSoon: reservation.endsAt.getTime() <= endingSoonBefore,
      })),
      latestEnquiries: latest.map(({ residence, ...enquiry }) => ({
        ...enquiry,
        residence: residence && { ...residence, areaM2: residence.areaM2.toNumber() },
      })),
    };
  }
}
