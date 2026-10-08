import { Logger, type INestApplication } from '@nestjs/common';
import { Prisma } from '../src/generated/prisma/client.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { ReservationsService } from '../src/reservations/reservations.service.js';
import { lockResidence } from '../src/reservations/status-change.js';
import { createTestApp, reseed } from './app.js';

function gate() {
  let open!: () => void;
  const wait = new Promise<void>((resolve) => (open = resolve));
  return { wait, open };
}

const settle = (promise: Promise<unknown>) =>
  promise.then(
    () => 'fulfilled',
    (error: unknown) => String(error),
  );

describe('Automatic release of expired reservations (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: ReservationsService;

  beforeEach(async () => {
    reseed();
    app = await createTestApp();
    prisma = app.get(PrismaService);
    service = app.get(ReservationsService);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  const actorId = async () => (await prisma.adminUser.findFirstOrThrow({ select: { id: true } })).id;
  const statusOf = async (number: string) =>
    (await prisma.residence.findUniqueOrThrow({ where: { number }, select: { status: true } })).status;
  const activeOf = (number: string) =>
    prisma.reservation.findFirst({ where: { residence: { number }, releasedAt: null } });

  async function expire(...numbers: string[]): Promise<void> {
    await prisma.reservation.updateMany({
      where: { residence: { number: { in: numbers } }, releasedAt: null },
      data: { endsAt: new Date(Date.now() - 1000) },
    });
  }

  async function reservedNumbers(count: number): Promise<string[]> {
    const rows = await prisma.residence.findMany({
      where: { status: 'RESERVED' },
      orderBy: { number: 'asc' },
      take: count,
      select: { number: true },
    });
    return rows.map((row) => row.number);
  }

  it('waits for a sale holding the residence and leaves the sale alone, without a deadlock', async () => {
    const actor = await actorId();
    await expire('7.04');
    const locked = gate();
    const proceed = gate();
    const sale = prisma.$transaction(
      async (tx) => {
        await lockResidence(tx, '7.04');
        locked.open();
        await proceed.wait;
        await service.changeStatus(tx, { number: '7.04', to: 'SOLD', actorId: actor });
      },
      { timeout: 10000 },
    );
    const saleResult = settle(sale);
    await locked.wait;
    const expiryResult = settle(service.releaseExpired());
    try {
      const deadline = Date.now() + 3000;
      while (true) {
        const [row] = await prisma.$queryRaw<{ waiting: number }[]>`
          SELECT count(*)::int AS waiting FROM pg_stat_activity
          WHERE datname = current_database() AND wait_event_type = 'Lock'`;
        if (row.waiting > 0) break;
        if (Date.now() > deadline) throw new Error('Expiry did not reach the locked residence');
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    } finally {
      proceed.open();
    }
    expect(await Promise.all([saleResult, expiryResult])).toEqual(['fulfilled', 'fulfilled']);
    expect(await statusOf('7.04')).toBe('SOLD');
    expect(await activeOf('7.04')).toBeNull();
  });

  it('does not release a new reservation made after the expired ones were listed', async () => {
    const actor = await actorId();
    await expire('7.04');
    const old = await activeOf('7.04');
    expect(old?.enquiryId).toEqual(expect.any(Number));
    const original = prisma.$transaction.bind(prisma);
    jest.spyOn(prisma, '$transaction').mockImplementationOnce(async (...args: Parameters<typeof original>) => {
      await service.release('7.04', actor);
      await service.reserve('7.04', old!.enquiryId!, actor);
      return original(...args);
    });

    expect(await service.releaseExpired()).toBe(0);
    expect(await statusOf('7.04')).toBe('RESERVED');
    const fresh = await activeOf('7.04');
    expect(fresh?.id).not.toBe(old!.id);
    expect(fresh!.endsAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('keeps releasing the rest of the batch when one residence fails', async () => {
    const [broken, healthy] = await reservedNumbers(2);
    await expire(broken, healthy);
    const logged = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(prisma, '$transaction').mockImplementationOnce(() => Promise.reject(new Error('disk is full')));

    expect(await service.releaseExpired()).toBe(1);
    expect(await statusOf(broken)).toBe('RESERVED');
    expect(await statusOf(healthy)).toBe('AVAILABLE');
    expect(logged).toHaveBeenCalledWith(expect.stringContaining(broken), expect.anything());
  });

  const conflictFromModelQuery = () =>
    new Prisma.PrismaClientKnownRequestError('Transaction failed due to a write conflict or a deadlock', {
      code: 'P2034',
      clientVersion: Prisma.prismaVersion.client,
    });
  const deadlockFromRawQuery = () =>
    new Prisma.PrismaClientKnownRequestError('Raw query failed. Code: `40P01`. Message: `deadlock detected`', {
      code: 'P2010',
      clientVersion: Prisma.prismaVersion.client,
      meta: { driverAdapterError: { cause: { originalCode: '40P01', kind: 'TransactionWriteConflict' } } },
    });

  it.each([
    ['a write conflict', conflictFromModelQuery],
    ['a deadlock in the residence lock', deadlockFromRawQuery],
  ])('retries a residence after %s', async (_, makeError) => {
    const [number] = await reservedNumbers(1);
    await expire(number);
    const transaction = jest.spyOn(prisma, '$transaction').mockImplementationOnce(() => Promise.reject(makeError()));

    expect(await service.releaseExpired()).toBe(1);
    expect(await statusOf(number)).toBe('AVAILABLE');
    expect(transaction).toHaveBeenCalledTimes(2);
  });

  it('gives up on a residence after three conflicts and leaves it for the next run', async () => {
    const [number] = await reservedNumbers(1);
    await expire(number);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const transaction = jest.spyOn(prisma, '$transaction').mockImplementation(() => Promise.reject(conflictFromModelQuery()));

    expect(await service.releaseExpired()).toBe(0);
    expect(transaction).toHaveBeenCalledTimes(3);
    transaction.mockRestore();
    expect(await statusOf(number)).toBe('RESERVED');
    expect(await service.releaseExpired()).toBe(1);
  });
});
