import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { createDemoClock } from './seed/dates.js';
import { ENQUIRIES } from './seed/enquiries.js';
import { planActivity, planReservations, planStatusChangedAt } from './seed/plan.js';
import { buildResidences } from './seed/residences.js';
import {
  createActivity,
  createReservations,
  recreateEnquiries,
  resetAuthState,
  upsertAdmin,
  upsertRates,
  upsertResidences,
} from './seed/writers.js';

const logger = new Logger('Seed');

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Environment variable ${name} is required for the seed`);
  return value;
}

async function seed(prisma: PrismaClient): Promise<void> {
  const clock = createDemoClock();
  const residences = buildResidences();
  const reservations = planReservations(clock);
  const statusChangedAt = planStatusChangedAt(residences, reservations, clock);
  const activity = planActivity(residences, statusChangedAt, clock);
  const admin = {
    email: requireEnv('ADMIN_EMAIL'),
    name: requireEnv('ADMIN_NAME'),
    password: requireEnv('ADMIN_PASSWORD'),
  };

  await prisma.$transaction(
    async (tx) => {
      await resetAuthState(tx);
      const manager = await upsertAdmin(tx, admin);
      await upsertRates(tx);
      const residenceIds = await upsertResidences(tx, residences, statusChangedAt);
      const enquiryIds = await recreateEnquiries(tx, residenceIds, clock);
      const ids = { residences: residenceIds, enquiries: enquiryIds, manager };
      await createReservations(tx, reservations, ids);
      await createActivity(tx, activity, ids);
    },
    { timeout: 60_000 },
  );

  logger.log(
    `Demo data ready: ${residences.length} residences, ${ENQUIRIES.length} enquiries, ` +
      `${reservations.length} reservations, ${activity.length} activity entries`,
  );
}

async function main(): Promise<void> {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: requireEnv('DATABASE_URL') }),
  });
  try {
    if (process.argv.includes('--if-empty') && (await prisma.residence.count()) > 0) {
      logger.log('Residences already exist, skipping the demo seed');
      return;
    }
    await seed(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  logger.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
