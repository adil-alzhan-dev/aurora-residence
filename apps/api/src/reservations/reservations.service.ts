import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { ResidenceStatus } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { applyStatusChange, defaultStatusNote, lockResidence, type Tx } from './status-change.js';

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

  constructor(private readonly prisma: PrismaService) {}

  async reserve(number: string, enquiryId: number, actorId: number, note?: string) {
    await this.prisma.$transaction(async (tx) => {
      const residence = await lockResidence(tx, number);
      if (residence.status !== 'AVAILABLE') throw notAvailable(number, residence.status);
      await this.changeStatus(tx, { number, to: 'RESERVED', actorId, enquiryId, note });
    });
    return this.state(number);
  }

  async release(number: string, actorId: number, note?: string) {
    await this.prisma.$transaction(async (tx) => {
      const residence = await lockResidence(tx, number);
      if (residence.status !== 'RESERVED') {
        throw new ConflictException(`Residence ${number} has no active reservation`);
      }
      await this.changeStatus(tx, { number, to: 'AVAILABLE', actorId, note });
    });
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

  async releaseExpired(now = new Date()): Promise<number> {
    const expired = await this.prisma.reservation.findMany({
      where: { releasedAt: null, endsAt: { lte: now }, residence: { status: 'RESERVED' } },
      select: {
        id: true,
        enquiryId: true,
        residence: { select: { id: true, number: true, status: true } },
      },
    });
    let released = 0;
    for (const { id, enquiryId, residence } of expired) {
      try {
        const done = await this.prisma.$transaction(async (tx) => {
          // Claim this exact reservation first so a newer one is never released by mistake.
          const claimed = await tx.reservation.updateMany({
            where: { id, releasedAt: null },
            data: { releasedAt: now },
          });
          if (claimed.count === 0) return false;
          await applyStatusChange(tx, {
            residence,
            to: 'AVAILABLE',
            actorId: null,
            enquiryId,
            note: EXPIRED_NOTE,
            now,
          });
          return true;
        });
        if (done) released += 1;
      } catch (error) {
        if (!(error instanceof ConflictException)) throw error;
        this.logger.warn(`Residence ${residence.number} changed while releasing, skipped`);
      }
    }
    return released;
  }

  async state(number: string): Promise<ResidenceReservationState> {
    const residence = await this.prisma.residence.findUnique({
      where: { number },
      select: { id: true, number: true, status: true },
    });
    if (!residence) throw new NotFoundException(`Residence ${number} not found`);
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

function notAvailable(number: string, status: ResidenceStatus): ConflictException {
  return new ConflictException(
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
  if (!enquiry) throw new NotFoundException(`Enquiry ${id} not found`);
  if (!enquiry.residence) {
    throw new BadRequestException(
      `Enquiry ${id} has no residence. Link it to ${residence.number} before reserving.`,
    );
  }
  if (enquiry.residence.id !== residence.id) {
    throw new BadRequestException(
      `Enquiry ${id} is about residence ${enquiry.residence.number}, not ${residence.number}. ` +
        `Choose an enquiry for ${residence.number}.`,
    );
  }
  if (enquiry.status === 'CLOSED') {
    throw new BadRequestException(`Enquiry ${id} is closed, reopen it before reserving`);
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
