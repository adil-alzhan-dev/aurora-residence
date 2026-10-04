import type { ActivityType } from '../../src/generated/prisma/enums.js';
import { addDays, type DemoClock } from './dates.js';
import { ENQUIRIES, type EnquirySeed } from './enquiries.js';
import type { ResidenceSeed } from './residences.js';

export const RESERVATION_DAYS = 7;

export interface ActivitySeed {
  type: ActivityType;
  createdAt: Date;
  residence?: string;
  enquiryIndex?: number;
  fromValue?: string;
  toValue?: string;
  byManager: boolean;
  note?: string;
}

export interface ReservationSeed {
  residence: string;
  enquiryIndex: number;
  startsAt: Date;
  endsAt: Date;
  releasedAt: Date | null;
}

export function planReservations(clock: DemoClock): ReservationSeed[] {
  return ENQUIRIES.flatMap((enquiry, enquiryIndex) => {
    if (!enquiry.reservedAt) return [];
    const startsAt = clock(enquiry.reservedAt);
    return [
      {
        residence: enquiry.residence,
        enquiryIndex,
        startsAt,
        endsAt: addDays(startsAt, RESERVATION_DAYS),
        releasedAt: enquiry.releasedAt ? clock(enquiry.releasedAt) : null,
      },
    ];
  });
}

export function planStatusChangedAt(
  residences: ResidenceSeed[],
  reservations: ReservationSeed[],
  clock: DemoClock,
): Map<string, Date> {
  const autumnPriceList = clock('Sep 1, 10:00');
  const firstSale = clock('Jun 5, 10:00');
  const result = new Map<string, Date>();
  let soldIndex = 0;

  for (const residence of residences) {
    if (residence.status === 'AVAILABLE') {
      result.set(residence.number, autumnPriceList);
    } else if (residence.status === 'RESERVED') {
      const active = reservations.find(
        (r) => r.residence === residence.number && r.releasedAt === null,
      );
      if (!active) throw new Error(`Reserved residence ${residence.number} has no reservation`);
      result.set(residence.number, active.startsAt);
    } else {
      // One sale a week from early June to late September, at varying hours.
      const soldAt = addDays(firstSale, soldIndex * 7);
      soldAt.setHours(10 + (soldIndex % 4) * 2);
      result.set(residence.number, soldAt);
      soldIndex += 1;
    }
  }
  return result;
}

function residence703History(clock: DemoClock): ActivitySeed[] {
  return [
    {
      type: 'STATUS_CHANGED', createdAt: clock('Jun 1, 09:00'), residence: '7.03',
      toValue: 'AVAILABLE', byManager: false, note: 'Sales start, listed at $206 000',
    },
    {
      type: 'PRICE_CHANGED', createdAt: clock('Jul 1, 10:00'), residence: '7.03',
      fromValue: '206000', toValue: '214000', byManager: true, note: 'Summer price list',
    },
    {
      type: 'PRICE_CHANGED', createdAt: clock('Sep 1, 10:00'), residence: '7.03',
      fromValue: '214000', toValue: '218000', byManager: true, note: 'Autumn price list',
    },
  ];
}

function enquiryHistory(enquiry: EnquirySeed, enquiryIndex: number, clock: DemoClock): ActivitySeed[] {
  const entries: ActivitySeed[] = [
    {
      type: 'ENQUIRY_RECEIVED', createdAt: clock(enquiry.receivedAt), enquiryIndex, byManager: false,
      note: `Enquiry received from the site, residence ${enquiry.residence} stays Available`,
    },
  ];
  if (enquiry.takenAt) {
    entries.push({
      type: 'ENQUIRY_STATUS_CHANGED', createdAt: clock(enquiry.takenAt), enquiryIndex,
      fromValue: 'NEW', toValue: 'IN_PROGRESS', byManager: true,
    });
  }
  if (enquiry.noteAddedAt) {
    entries.push({
      type: 'NOTE_ADDED', createdAt: clock(enquiry.noteAddedAt), enquiryIndex,
      byManager: true, note: enquiry.managerNote,
    });
  }
  if (enquiry.reservedAt) {
    entries.push({
      type: 'STATUS_CHANGED', createdAt: clock(enquiry.reservedAt), enquiryIndex,
      residence: enquiry.residence, fromValue: 'AVAILABLE', toValue: 'RESERVED', byManager: true,
      note: `Reserved for ${RESERVATION_DAYS} days, enquiry from ${enquiry.name}`,
    });
  }
  if (enquiry.releasedAt) {
    entries.push({
      type: 'STATUS_CHANGED', createdAt: clock(enquiry.releasedAt), enquiryIndex,
      residence: enquiry.residence, fromValue: 'RESERVED', toValue: 'AVAILABLE', byManager: false,
      note: `Reservation ended after ${RESERVATION_DAYS} days without a deal`,
    });
  }
  if (enquiry.closedAt) {
    entries.push({
      type: 'ENQUIRY_STATUS_CHANGED', createdAt: clock(enquiry.closedAt), enquiryIndex,
      fromValue: 'IN_PROGRESS', toValue: 'CLOSED', byManager: true, note: enquiry.closeNote,
    });
  }
  return entries;
}

export function planActivity(
  residences: ResidenceSeed[],
  statusChangedAt: Map<string, Date>,
  clock: DemoClock,
): ActivitySeed[] {
  const sales: ActivitySeed[] = residences
    .filter((r) => r.status === 'SOLD')
    .map((r) => ({
      type: 'STATUS_CHANGED',
      createdAt: statusChangedAt.get(r.number) as Date,
      residence: r.number,
      fromValue: 'AVAILABLE',
      toValue: 'SOLD',
      byManager: true,
      note: 'Contract signed',
    }));

  return [
    ...residence703History(clock),
    ...ENQUIRIES.flatMap((enquiry, index) => enquiryHistory(enquiry, index, clock)),
    ...sales,
  ];
}
