import * as argon2 from 'argon2';
import type { Prisma } from '../../src/generated/prisma/client.js';
import type { DemoClock } from './dates.js';
import { ENQUIRIES, enquiryEmail } from './enquiries.js';
import type { ActivitySeed, ReservationSeed } from './plan.js';
import { CURRENCY_RATES } from './rates.js';
import type { ResidenceSeed } from './residences.js';

type Tx = Prisma.TransactionClient;

export interface AdminSeed {
  email: string;
  name: string;
  password: string;
}

export async function upsertAdmin(tx: Tx, admin: AdminSeed): Promise<number> {
  const fields = {
    email: admin.email,
    name: admin.name,
    passwordHash: await argon2.hash(admin.password),
    role: 'MANAGER' as const,
  };
  const saved = await tx.adminUser.upsert({
    where: { email: admin.email },
    create: fields,
    update: fields,
  });
  return saved.id;
}

export async function upsertRates(tx: Tx): Promise<void> {
  for (const rate of CURRENCY_RATES) {
    await tx.currencyRate.upsert({
      where: { code: rate.code },
      create: rate,
      update: { perUsd: rate.perUsd },
    });
  }
}

/** Demo reset signs everyone out and clears sign-in lockouts. */
export async function resetAuthState(tx: Tx): Promise<void> {
  await tx.adminSession.deleteMany();
  await tx.loginThrottle.deleteMany();
}

export async function upsertResidences(
  tx: Tx,
  residences: ResidenceSeed[],
  statusChangedAt: Map<string, Date>,
): Promise<Map<string, number>> {
  const ids = new Map<string, number>();
  for (const residence of residences) {
    const fields = { ...residence, statusChangedAt: statusChangedAt.get(residence.number) as Date };
    const saved = await tx.residence.upsert({
      where: { number: residence.number },
      create: fields,
      update: fields,
    });
    ids.set(residence.number, saved.id);
  }
  return ids;
}

export async function recreateEnquiries(
  tx: Tx,
  residenceIds: Map<string, number>,
  clock: DemoClock,
): Promise<number[]> {
  await tx.activityLog.deleteMany();
  await tx.reservation.deleteMany();
  await tx.enquiry.deleteMany();

  const ids: number[] = [];
  for (const enquiry of ENQUIRIES) {
    const saved = await tx.enquiry.create({
      data: {
        name: enquiry.name,
        phone: enquiry.phone,
        email: enquiryEmail(enquiry.name),
        comment: enquiry.comment,
        residenceId: residenceIds.get(enquiry.residence) as number,
        status: enquiry.status,
        locale: enquiry.locale,
        currency: enquiry.currency,
        source: enquiry.source,
        managerNote: enquiry.managerNote ?? null,
        createdAt: clock(enquiry.receivedAt),
      },
    });
    ids.push(saved.id);
  }
  return ids;
}

export async function createReservations(
  tx: Tx,
  reservations: ReservationSeed[],
  ids: { residences: Map<string, number>; enquiries: number[]; manager: number },
): Promise<void> {
  await tx.reservation.createMany({
    data: reservations.map((r) => ({
      residenceId: ids.residences.get(r.residence) as number,
      enquiryId: ids.enquiries[r.enquiryIndex],
      startsAt: r.startsAt,
      endsAt: r.endsAt,
      releasedAt: r.releasedAt,
      createdById: ids.manager,
      createdAt: r.startsAt,
    })),
  });
}

export async function createActivity(
  tx: Tx,
  activity: ActivitySeed[],
  ids: { residences: Map<string, number>; enquiries: number[]; manager: number },
): Promise<void> {
  await tx.activityLog.createMany({
    data: activity.map((entry) => ({
      type: entry.type,
      residenceId: entry.residence ? (ids.residences.get(entry.residence) as number) : null,
      enquiryId: entry.enquiryIndex === undefined ? null : ids.enquiries[entry.enquiryIndex],
      fromValue: entry.fromValue ?? null,
      toValue: entry.toValue ?? null,
      actorId: entry.byManager ? ids.manager : null,
      note: entry.note ?? null,
      createdAt: entry.createdAt,
    })),
  });
}
