import { ConflictException, HttpStatus } from '@nestjs/common';
import { ApiError } from '../common/api-error.js';
import { ERROR_CODES } from '../common/error-codes.js';
import { Prisma } from '../generated/prisma/client.js';
import type { ResidenceStatus } from '../generated/prisma/enums.js';

export const RESERVATION_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 3;

export type Tx = Prisma.TransactionClient;

export interface StatusChange {
  residence: { id: number; number: string; status: ResidenceStatus };
  to: ResidenceStatus;
  /** null means the change was made by the system (shown as "System"). */
  actorId: number | null;
  note: string;
  /** Enquiry for a new reservation, or of a reservation the caller already closed. */
  enquiryId?: number | null;
  now: Date;
}

/**
 * Reads the residence and locks its row until the transaction ends, so the status
 * checked by the caller is still the status when the change is written.
 */
export async function lockResidence(tx: Tx, number: string): Promise<StatusChange['residence']> {
  const [residence] = await tx.$queryRaw<StatusChange['residence'][]>`
    SELECT id, number, status FROM "Residence" WHERE number = ${number} FOR UPDATE`;
  if (!residence) throw new ApiError(HttpStatus.NOT_FOUND, ERROR_CODES.RESIDENCE_NOT_FOUND, `Residence ${number} not found`);
  return residence;
}

/**
 * Runs a whole transaction again when PostgreSQL aborted it over a deadlock or a
 * write conflict. Rerunning is safe because the aborted attempt wrote nothing.
 */
export async function withConflictRetry<T>(run: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      if (!isWriteConflict(error) || attempt >= MAX_ATTEMPTS) throw error;
    }
  }
}

// Prisma reports it as P2034 from model queries, but as P2010 from $queryRaw
// (lockResidence), where only the driver adapter's cause tells what happened.
function isWriteConflict(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code === 'P2034') return true;
  const cause = (error.meta?.driverAdapterError as { cause?: { kind?: unknown } } | undefined)?.cause;
  return cause?.kind === 'TransactionWriteConflict';
}

/**
 * Moves a residence to a new status and keeps reservations in step:
 * leaving RESERVED closes the active reservation, entering RESERVED opens one.
 * The conditional update on the status read earlier makes concurrent changes
 * of the same residence fail with 409 instead of both succeeding.
 */
export async function applyStatusChange(tx: Tx, change: StatusChange): Promise<void> {
  const { residence, to, now } = change;
  const updated = await tx.residence.updateMany({
    where: { id: residence.id, status: residence.status },
    data: { status: to, statusChangedAt: now },
  });
  if (updated.count === 0) {
    throw new ConflictException(
      `Residence ${residence.number} is no longer ${residence.status.toLowerCase()}, ` +
        'someone has just changed it. Reload and try again.',
    );
  }

  let enquiryId = change.enquiryId ?? null;
  if (residence.status === 'RESERVED') {
    const active = await tx.reservation.findFirst({
      where: { residenceId: residence.id, releasedAt: null },
      select: { enquiryId: true },
    });
    enquiryId = active?.enquiryId ?? enquiryId;
    await tx.reservation.updateMany({
      where: { residenceId: residence.id, releasedAt: null },
      data: { releasedAt: now },
    });
  }
  if (to === 'RESERVED') {
    await tx.reservation.create({
      data: {
        residenceId: residence.id,
        enquiryId,
        startsAt: now,
        endsAt: new Date(now.getTime() + RESERVATION_DAYS * DAY_MS),
        createdById: change.actorId,
      },
    });
  }

  await tx.activityLog.create({
    data: {
      type: 'STATUS_CHANGED',
      residenceId: residence.id,
      enquiryId,
      fromValue: residence.status,
      toValue: to,
      actorId: change.actorId,
      note: change.note,
      createdAt: now,
    },
  });
}

export function defaultStatusNote(
  from: ResidenceStatus,
  to: ResidenceStatus,
  enquiryName?: string,
): string {
  if (to === 'RESERVED') {
    const base = `Reserved for ${RESERVATION_DAYS} days`;
    return enquiryName ? `${base}, enquiry from ${enquiryName}` : base;
  }
  if (to === 'SOLD') return 'Contract signed';
  return from === 'RESERVED' ? 'Reservation released by manager' : 'Back on sale';
}
