import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReservationsService } from './reservations.service.js';

@Injectable()
export class ReservationsScheduler {
  private readonly logger = new Logger(ReservationsScheduler.name);

  constructor(private readonly reservations: ReservationsService) {}

  @Cron(CronExpression.EVERY_MINUTE, { name: 'release-expired-reservations' })
  async releaseExpired(): Promise<void> {
    try {
      const released = await this.reservations.releaseExpired();
      if (released > 0) this.logger.log(`Released ${released} expired reservation(s)`);
    } catch (error) {
      this.logger.error('Failed to release expired reservations', error instanceof Error ? error.stack : error);
    }
  }
}
