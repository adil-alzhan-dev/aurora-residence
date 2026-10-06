import type { INestApplication } from '@nestjs/common';
import { LiveService } from '../src/live/live.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { ReservationsService } from '../src/reservations/reservations.service.js';
import { createTestApp, http, reseed, signIn } from './app.js';
import { connectLive, listenForLive, waitFor, type LiveConnection } from './live-client.js';

interface Published {
  number: string;
  /** Read outside the request transaction, so it is what other clients already see. */
  committed: { status: string; priceUsd: number };
}

describe('residence.updated events (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let live: LiveConnection;
  const published: Published[] = [];

  beforeAll(async () => {
    reseed();
    app = await createTestApp();
    prisma = app.get(PrismaService);
    const service = app.get(LiveService);
    const publish = service.residenceUpdated.bind(service);
    jest.spyOn(service, 'residenceUpdated').mockImplementation(async (number) => {
      const committed = await prisma.residence.findUniqueOrThrow({
        where: { number },
        select: { status: true, priceUsd: true },
      });
      published.push({ number, committed });
      await publish(number);
    });
    live = await connectLive(await listenForLive(app));
    token = await signIn(app);
  });

  beforeEach(() => {
    published.length = 0;
    live.messages.length = 0;
  });

  afterAll(async () => {
    live.socket.terminate();
    await app.close();
  });

  const admin = () => ({ Authorization: `Bearer ${token}` });
  const enquiryId = async (name: string) =>
    (await prisma.enquiry.findFirstOrThrow({ where: { name }, select: { id: true } })).id;
  const lastEvent = async () => {
    await waitFor(() => live.messages.length > 0);
    return JSON.parse(live.messages[live.messages.length - 1]) as {
      type: string;
      residence: { number: string; status: string; priceUsd: number };
    };
  };

  it('publishes a reservation after it is committed, and nothing on 409', async () => {
    const id = await enquiryId('Elena Marsh');
    await http(app).post('/api/admin/residences/7.03/reserve').set(admin()).send({ enquiryId: id }).expect(201);

    expect(published).toEqual([{ number: '7.03', committed: { status: 'RESERVED', priceUsd: 218000 } }]);
    expect(await lastEvent()).toMatchObject({
      type: 'residence.updated',
      residence: { number: '7.03', floor: 7, status: 'RESERVED', priceUsd: 218000 },
    });

    await http(app).post('/api/admin/residences/7.03/reserve').set(admin()).send({ enquiryId: id }).expect(409);
    expect(published).toHaveLength(1);
  });

  it('publishes a released reservation, and nothing when there is none to release', async () => {
    await http(app).post('/api/admin/residences/7.03/release').set(admin()).send({}).expect(200);
    expect(published).toEqual([{ number: '7.03', committed: { status: 'AVAILABLE', priceUsd: 218000 } }]);
    expect((await lastEvent()).residence).toMatchObject({ number: '7.03', status: 'AVAILABLE' });

    await http(app).post('/api/admin/residences/7.03/release').set(admin()).send({}).expect(409);
    expect(published).toHaveLength(1);
  });

  it('publishes a new price and a status change from the residence card', async () => {
    await http(app).patch('/api/admin/residences/7.01').set(admin()).send({ priceUsd: 97000 }).expect(200);
    expect(published).toEqual([{ number: '7.01', committed: { status: 'AVAILABLE', priceUsd: 97000 } }]);
    expect((await lastEvent()).residence).toMatchObject({ number: '7.01', priceUsd: 97000 });

    await http(app).patch('/api/admin/residences/7.01').set(admin()).send({ status: 'SOLD' }).expect(200);
    expect(published[1]).toEqual({ number: '7.01', committed: { status: 'SOLD', priceUsd: 97000 } });
  });

  it('publishes nothing when the price is sent unchanged', async () => {
    await http(app).patch('/api/admin/residences/7.05').set(admin()).send({ priceUsd: 298000 }).expect(200);
    expect(published).toEqual([]);
  });

  it('publishes nothing when the transaction is rolled back', async () => {
    // The price is written first, then the status check fails and undoes it.
    await http(app)
      .patch('/api/admin/residences/7.06')
      .set(admin())
      .send({ priceUsd: 999000, status: 'RESERVED' })
      .expect(400);
    const elena = await enquiryId('Elena Marsh');
    await http(app).post('/api/admin/residences/6.01/reserve').set(admin()).send({ enquiryId: elena }).expect(400);

    expect((await prisma.residence.findUniqueOrThrow({ where: { number: '7.06' } })).priceUsd).toBe(318000);
    expect(published).toEqual([]);
    expect(live.messages).toEqual([]);
  });

  it('publishes every residence released by the expiry job', async () => {
    const id = await enquiryId('Daniel Okafor');
    await http(app).post('/api/admin/residences/6.05/reserve').set(admin()).send({ enquiryId: id }).expect(201);
    published.length = 0;
    await prisma.reservation.updateMany({
      where: { residence: { number: { in: ['6.05', '7.04'] } }, releasedAt: null },
      data: { endsAt: new Date(Date.now() - 60_000) },
    });

    expect(await app.get(ReservationsService).releaseExpired()).toBe(2);

    expect(published.map((event) => event.number).sort()).toEqual(['6.05', '7.04']);
    expect(published.every((event) => event.committed.status === 'AVAILABLE')).toBe(true);
  });
});
