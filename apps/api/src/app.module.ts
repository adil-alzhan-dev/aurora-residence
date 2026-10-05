import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { AdminEnquiriesModule } from './admin/enquiries/admin-enquiries.module.js';
import { DashboardModule } from './admin/dashboard/dashboard.module.js';
import { AdminResidencesModule } from './admin/residences/admin-residences.module.js';
import { AuthModule } from './auth/auth.module.js';
import { MINUTE_MS } from './common/throttle.js';
import { EnquiriesModule } from './enquiries/enquiries.module.js';
import { FloorsModule } from './floors/floors.module.js';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RatesModule } from './rates/rates.module.js';
import { ReservationsModule } from './reservations/reservations.module.js';
import { ResidencesModule } from './residences/residences.module.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    // Limits are applied per route with @Throttle; this is only the fallback.
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: MINUTE_MS, limit: 60 }],
      errorMessage: 'Too many requests. Please try again later.',
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    ResidencesModule,
    FloorsModule,
    RatesModule,
    EnquiriesModule,
    ReservationsModule,
    DashboardModule,
    AdminResidencesModule,
    AdminEnquiriesModule,
  ],
})
export class AppModule {}
