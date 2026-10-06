import type { INestApplication } from '@nestjs/common';
import type { Response } from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { ReservationsService } from '../src/reservations/reservations.service.js';
import { createTestApp, http, reseed, signIn } from './app.js';

interface ReserveBody {
  status: string;
  reservation: { enquiry: { id: number; name: string } | null } | null;
}

/**
 * Request A is held after it has read the residence as Available and before the
 * status change. Request B then runs until it either finishes (no row lock) or
 * waits for A's lock. Only after that is A let go, so the order is the same on
 * every run.
 */
describe('Concurrent reservations of one residence (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;

  beforeEach(async () => {
    reseed();
    app = await createTestApp();
    prisma = app.get(PrismaService);
    token = await signIn(app);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  const enquiryId = async (name: string) =>
    (await prisma.enquiry.findFirstOrThrow({ where: { name }, select: { id: true } })).id;

  const reserve = (number: string, id: number): Promise<Response> =>
    http(app)
      .post(`/api/admin/residences/${number}/reserve`)
      .set({ Authorization: `Bearer ${token}` })
      .send({ enquiryId: id })
      .then((response) => response);

  const waitingForLock = async () => {
    const [row] = await prisma.$queryRaw<{ waiting: number }[]>`
      SELECT count(*)::int AS waiting FROM pg_stat_activity
      WHERE datname = current_database() AND wait_event_type = 'Lock'`;
    return row.waiting > 0;
  };

  async function race(first: number, second: number): Promise<[Response, Response]> {
    const service = app.get(ReservationsService);
    const original = service.changeStatus.bind(service);
    let firstArrived!: () => void;
    const arrived = new Promise<void>((resolve) => (firstArrived = resolve));
    let releaseFirst!: () => void;
    const released = new Promise<void>((resolve) => (releaseFirst = resolve));
    let calls = 0;
    jest.spyOn(service, 'changeStatus').mockImplementation(async (tx, request) => {
      calls += 1;
      if (calls === 1) {
        firstArrived();
        await released;
      }
      return original(tx, request);
    });

    const a = reserve('7.03', first);
    await arrived;
    let bDone = false;
    const b = reserve('7.03', second).finally(() => (bDone = true));
    const deadline = Date.now() + 10_000;
    while (!bDone && !(await waitingForLock())) {
      if (Date.now() > deadline) throw new Error('Request B neither finished nor waited for the lock');
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    releaseFirst();
    return Promise.all([a, b]);
  }

  it('gives one 201 and one 409 to two enquiries for the same residence', async () => {
    const elena = await enquiryId('Elena Marsh');
    const other = await prisma.enquiry.create({
      data: {
        name: 'Tomas Novak',
        phone: '+1 (555) 010-7731',
        email: 'tomas.novak@example.com',
        comment: 'Is 7.03 still available?',
        residence: { connect: { number: '7.03' } },
        source: 'Residence page',
      },
      select: { id: true },
    });

    const responses = await race(other.id, elena);

    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
    const winner = responses.find((r) => r.status === 201)!;
    const winnerId = winner === responses[0] ? other.id : elena;
    expect((winner.body as ReserveBody).reservation?.enquiry?.id).toBe(winnerId);
    const active = await prisma.reservation.findMany({
      where: { residence: { number: '7.03' }, releasedAt: null },
      select: { enquiryId: true },
    });
    expect(active).toEqual([{ enquiryId: winnerId }]);
  });

  it('never confirms a reservation for an enquiry about another residence', async () => {
    const jonas = await enquiryId('Jonas Weber');
    const elena = await enquiryId('Elena Marsh');

    const [wrong, right] = await race(jonas, elena);

    expect(wrong.status).toBe(400);
    expect((wrong.body as { message: string }).message).toContain('is about residence 9.03, not 7.03');
    expect(right.status).toBe(201);
    expect((right.body as ReserveBody).reservation?.enquiry?.id).toBe(elena);
  });
});
