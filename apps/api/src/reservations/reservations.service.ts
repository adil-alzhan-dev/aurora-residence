import { BadRequestException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ApiError } from '../common/api-error.js';
import { ERROR_CODES } from '../common/error-codes.js';
import type { ResidenceStatus } from '../generated/prisma/enums.js';
import { LiveService } from '../live/live.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { applyStatusChange, defaultStatusNote, lockResidence, type Tx, withConflictRetry } from './status-change.js';

const EXPIRED_NOTE = 'Reservation ended after 7 days without a deal';

export interface ActiveReservation {
  startsAt: Date;
  endsAt: Date;
  enquiry: { id: number; name: string } | null;
  createdBy: string;
}

export interface ResidenceReservationState {
  number: string;
  status: ResidenceStatus;
  reservation: ActiveReservation | null;
}

export interface StatusChangeRequest {
  number: string;
  to: ResidenceStatus;
  actorId: number;
  enquiryId?: number;
  note?: string;
}

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly live: LiveService,
  ) {}

  async reserve(number: string, enquiryId: number, actorId: number, note?: string) {
    await this.prisma.$transaction(async (tx) => {
      const residence = await lockResidence(tx, number);
      if (residence.status !== 'AVAILABLE') throw notAvailable(number, residence.status);
      await this.changeStatus(tx, { number, to: 'RESERVED', actorId, enquiryId, note });
    });
    await this.live.residenceUpdated(number);
    return this.state(number);
  }

  async release(number: string, actorId: number, note?: string) {
    await this.prisma.$transaction(async (tx) => {
      const residence = await lockResidence(tx, number);
      if (residence.status !== 'RESERVED') {
        throw new ApiError(
          HttpStatus.CONFLICT,
          ERROR_CODES.NO_ACTIVE_RESERVATION,
          `Residence ${number} has no active reservation`,
        );
      }
      await this.changeStatus(tx, { number, to: 'AVAILABLE', actorId, note });
    });
    await this.live.residenceUpdated(number);
    return this.state(number);
  }

  async changeStatus(tx: Tx, request: StatusChangeRequest): Promise<void> {
    // The only way into RESERVED is a reservation for an enquiry about this residence.
    if (request.to === 'RESERVED' && request.enquiryId === undefined) {
      throw new BadRequestException(
        `Residence ${request.number} can be reserved only for an enquiry, ` +
          'use POST /api/admin/residences/:number/reserve',
      );
    }
    const residence = await lockResidence(tx, request.number);
    if (request.to === 'RESERVED') {
      // No "already reserved" shortcut: someone else's reservation must never look like ours.
      if (residence.status !== 'AVAILABLE') throw notAvailable(request.number, residence.status);
    } else if (residence.status === request.to) {
      return;
    }
    const enquiry =
      request.to === 'RESERVED' && request.enquiryId !== undefined
        ? await findEnquiryForReservation(tx, request.enquiryId, residence)
        : null;
    await applyStatusChange(tx, {
      residence,
      to: request.to,
      actorId: request.actorId,
      enquiryId: enquiry?.id ?? null,
      note: request.note ?? defaultStatusNote(residence.status, request.to, enquiry?.name),
      now: new Date(),
    });
    if (enquiry?.status === 'NEW') await startEnquiry(tx, enquiry.id, request.actorId);
  }

  /**
   * Each residence gets its own transaction, so one failure is logged and the rest
   * of the batch still goes through; the next cron tick picks the failed one up.
   */
  async releaseExpired(now = new Date()): Promise<number> {
    const expired = await this.prisma.reservation.findMany({
      where: { releasedAt: null, endsAt: { lte: now }, residence: { status: 'RESERVED' } },
      select: { id: true, residence: { select: { number: true } } },
    });
    let released = 0;
    for (const { id, residence } of expired) {
      try {
        if (!(await withConflictRetry(() => this.releaseOneExpired(id, residence.number, now)))) continue;
        released += 1;
        await this.live.residenceUpdated(residence.number);
      } catch (error) {
        this.logger.error(
          `Could not release expired reservation ${id} of residence ${residence.number}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
    return released;
  }

  /**
   * Residence first, then reservation: the same lock order as reserve, release and
   * sale, so expiry cannot deadlock with them. The list was read before the lock,
   * so the reservation and the status are checked again under it.
   */
  private releaseOneExpired(reservationId: number, number: string, now: Date): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const residence = await lockResidence(tx, number);
      if (residence.status !== 'RESERVED') return false;
      const reservation = await tx.reservation.findFirst({
        where: { id: reservationId, residenceId: residence.id, releasedAt: null, endsAt: { lte: now } },
        select: { enquiryId: true },
      });
      if (!reservation) return false;
      await applyStatusChange(tx, {
        residence,
        to: 'AVAILABLE',
        actorId: null,
        enquiryId: reservation.enquiryId,
        note: EXPIRED_NOTE,
        now,
      });
      return true;
    });
  }

  async state(number: string): Promise<ResidenceReservationState> {
    const residence = await this.prisma.residence.findUnique({
      where: { number },
      select: { id: true, number: true, status: true },
    });
    if (!residence) throw new ApiError(HttpStatus.NOT_FOUND, ERROR_CODES.RESIDENCE_NOT_FOUND, `Residence ${number} not found`);
    return {
      number: residence.number,
      status: residence.status,
      reservation: await this.activeReservation(residence.id),
    };
  }

  async activeReservation(residenceId: number): Promise<ActiveReservation | null> {
    const reservation = await this.prisma.reservation.findFirst({
      where: { residenceId, releasedAt: null },
      select: {
        startsAt: true,
        endsAt: true,
        enquiry: { select: { id: true, name: true } },
        createdBy: { select: { name: true } },
      },
    });
    if (!reservation) return null;
    return {
      startsAt: reservation.startsAt,
      endsAt: reservation.endsAt,
      enquiry: reservation.enquiry,
      createdBy: reservation.createdBy?.name ?? 'System',
    };
  }
}

function notAvailable(number: string, status: ResidenceStatus): ApiError {
  return new ApiError(
    HttpStatus.CONFLICT,
    status === 'SOLD' ? ERROR_CODES.RESIDENCE_SOLD : ERROR_CODES.RESIDENCE_RESERVED,
    `Residence ${number} is ${status.toLowerCase()}, only an available residence can be reserved`,
  );
}

async function findEnquiryForReservation(
  tx: Tx,
  id: number,
  residence: { id: number; number: string },
) {
  const enquiry = await tx.enquiry.findUnique({
    where: { id },
    select: { id: true, name: true, status: true, residence: { select: { id: true, number: true } } },
  });
  if (!enquiry) throw new ApiError(HttpStatus.NOT_FOUND, ERROR_CODES.ENQUIRY_NOT_FOUND, `Enquiry ${id} not found`);
  if (!enquiry.residence) {
    throw new ApiError(
      HttpStatus.BAD_REQUEST,
      ERROR_CODES.ENQUIRY_HAS_NO_RESIDENCE,
      `Enquiry ${id} has no residence. Link it to ${residence.number} before reserving.`,
    );
  }
  if (enquiry.residence.id !== residence.id) {
    throw new ApiError(
      HttpStatus.BAD_REQUEST,
      ERROR_CODES.ENQUIRY_RESIDENCE_MISMATCH,
      `Enquiry ${id} is about residence ${enquiry.residence.number}, not ${residence.number}. ` +
        `Choose an enquiry for ${residence.number}.`,
    );
  }
  if (enquiry.status === 'CLOSED') {
    throw new ApiError(
      HttpStatus.BAD_REQUEST,
      ERROR_CODES.ENQUIRY_CLOSED,
      `Enquiry ${id} is closed, reopen it before reserving`,
    );
  }
  return enquiry;
}

/** A reservation means the manager has taken the enquiry on. */
async function startEnquiry(tx: Tx, id: number, actorId: number): Promise<void> {
  await tx.enquiry.update({ where: { id }, data: { status: 'IN_PROGRESS' } });
  await tx.activityLog.create({
    data: {
      type: 'ENQUIRY_STATUS_CHANGED',
      enquiryId: id,
      actorId,
      fromValue: 'NEW',
      toValue: 'IN_PROGRESS',
      note: 'Residence reserved for this enquiry',
    },
  });
}
