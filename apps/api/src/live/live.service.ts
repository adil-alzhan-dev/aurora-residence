import { Injectable, Logger } from '@nestjs/common';
import type { ResidenceStatus } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { LiveGateway } from './live.gateway.js';

export interface ResidenceUpdatedEvent {
  type: 'residence.updated';
  residence: {
    number: string;
    floor: number;
    status: ResidenceStatus;
    priceUsd: number;
    updatedAt: string;
  };
}

@Injectable()
export class LiveService {
  private readonly logger = new Logger(LiveService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: LiveGateway,
  ) {}

  /**
   * Call only after the transaction has committed. Reads the committed row, so a
   * late event still carries the latest state. Never throws: the change is already
   * saved and a lost event must not turn the request into an error.
   */
  async residenceUpdated(number: string): Promise<void> {
    try {
      const row = await this.prisma.residence.findUnique({
        where: { number },
        select: { number: true, floor: true, status: true, priceUsd: true, updatedAt: true },
      });
      if (!row) return;
      const event: ResidenceUpdatedEvent = {
        type: 'residence.updated',
        residence: { ...row, updatedAt: row.updatedAt.toISOString() },
      };
      this.gateway.broadcast(JSON.stringify(event));
    } catch (error) {
      this.logger.error(
        `Failed to publish residence ${number}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }
}
