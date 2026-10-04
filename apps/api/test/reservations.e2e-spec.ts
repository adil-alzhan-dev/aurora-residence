import type { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { ReservationsService } from '../src/reservations/reservations.service.js';
import { createTestApp, http, reseed, signIn } from './app.js';

interface Card {
  status: string;
  reservation: { endsAt: string; enquiry: { name: string } | null; createdBy: string } | null;
  history: { author: string; note: string | null; from: string | null; to: string | null }[];
}

describe('Reservations (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;

  beforeAll(async () => {
    reseed();
    app = await createTestApp();
    prisma = app.get(PrismaService);
    token = await signIn(app);
  });

  afterAll(async () => {
    await app.close();
  });

  const admin = () => ({ Authorization: `Bearer ${token}` });
  const enquiryId = async (name: string) =>
    (await prisma.enquiry.findFirstOrThrow({ where: { name }, select: { id: true } })).id;
  const card = async (number: string) =>
    (await http(app).get(`/api/admin/residences/${number}`).set(admin()).expect(200)).body as Card;
  const activeReservations = (number: string) =>
    prisma.reservation.count({ where: { residence: { number }, releasedAt: null } });

  it('reserves 7.03 for Elena Marsh for 7 days and shows it on the site', async () => {
    const id = await enquiryId('Elena Marsh');
    const response = await http(app)
      .post('/api/admin/residences/7.03/reserve')
      .set(admin())
      .send({ enquiryId: id })
      .expect(201);
    const body = response.body as { status: string; reservation: { endsAt: string } };
    expect(body.status).toBe('RESERVED');
    const days = (new Date(body.reservation.endsAt).getTime() - Date.now()) / 86_400_000;
    expect(days).toBeCloseTo(7, 1);

    const floor = await http(app).get('/api/floors/7').expect(200);
    expect(floor.body).toMatchObject({ available: 3 });

    const history = (await card('7.03')).history;
    expect(history[0]).toMatchObject({ author: 'Maya Collins', to: 'RESERVED', note: 'Reserved for 7 days, enquiry from Elena Marsh' });

    await http(app).post('/api/admin/residences/7.03/reserve').set(admin()).send({ enquiryId: id }).expect(409);
  });

  it('refuses a reservation with an enquiry about another residence', async () => {
    const id = await enquiryId('Elena Marsh');
    const response = await http(app)
      .post('/api/admin/residences/6.01/reserve')
      .set(admin())
      .send({ enquiryId: id })
      .expect(400);
    expect((response.body as { message: string }).message).toContain('is about residence 7.03, not 6.01');
    expect((await card('6.01')).status).toBe('AVAILABLE');
    expect(await activeReservations('6.01')).toBe(0);
  });

  it('moves a New enquiry to In progress when its residence is reserved', async () => {
    const id = await enquiryId('Jonas Weber');
    await http(app).post('/api/admin/residences/9.03/reserve').set(admin()).send({ enquiryId: id }).expect(201);

    const enquiry = await http(app).get(`/api/admin/enquiries/${id}`).set(admin()).expect(200);
    const body = enquiry.body as { status: string; activity: { type: string; from: string; to: string; author: string }[] };
    expect(body.status).toBe('IN_PROGRESS');
    expect(body.activity).toContainEqual(
      expect.objectContaining({ type: 'ENQUIRY_STATUS_CHANGED', from: 'NEW', to: 'IN_PROGRESS', author: 'Maya Collins' }),
    );
  });

  it('allows only one of two parallel reservations', async () => {
    const id = await enquiryId('Amira Haddad');
    const results = await Promise.all(
      [1, 2].map(() =>
        http(app).post('/api/admin/residences/4.06/reserve').set(admin()).send({ enquiryId: id }),
      ),
    );
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await activeReservations('4.06')).toBe(1);
  });

  it('releases a reservation manually', async () => {
    await http(app).post('/api/admin/residences/4.06/release').set(admin()).send({}).expect(200);
    expect((await card('4.06')).status).toBe('AVAILABLE');
    expect(await activeReservations('4.06')).toBe(0);
    await http(app).post('/api/admin/residences/4.06/release').set(admin()).send({}).expect(409);
  });

  it('keeps status and reservations in step on PATCH', async () => {
    await http(app).patch('/api/admin/residences/7.04').set(admin()).send({ status: 'SOLD' }).expect(200);
    expect(await activeReservations('7.04')).toBe(0);

    await http(app).patch('/api/admin/residences/6.02').set(admin()).send({ status: 'RESERVED' }).expect(200);
    expect(await activeReservations('6.02')).toBe(1);
    await http(app).patch('/api/admin/residences/6.02').set(admin()).send({ status: 'AVAILABLE' }).expect(200);
    expect(await activeReservations('6.02')).toBe(0);

    await http(app).patch('/api/admin/residences/7.04').set(admin()).send({ status: 'RESERVED' }).expect(409);
  });

  it('logs a price change with the manager as author', async () => {
    await http(app)
      .patch('/api/admin/residences/6.01')
      .set(admin())
      .send({ priceUsd: 99_000, note: 'Winter price list' })
      .expect(200);
    expect((await card('6.01')).history[0]).toMatchObject({
      author: 'Maya Collins', from: '93000', to: '99000', note: 'Winter price list',
    });
  });

  it('returns expired reservations to Available on behalf of System', async () => {
    const id = await enquiryId('Daniel Okafor');
    await http(app).post('/api/admin/residences/6.05/reserve').set(admin()).send({ enquiryId: id }).expect(201);
    await prisma.reservation.updateMany({
      where: { residence: { number: '6.05' }, releasedAt: null },
      data: { endsAt: new Date(Date.now() - 60_000) },
    });

    const released = await app.get(ReservationsService).releaseExpired();

    expect(released).toBe(1);
    const residence = await card('6.05');
    expect(residence.status).toBe('AVAILABLE');
    expect(residence.reservation).toBeNull();
    expect(residence.history[0]).toMatchObject({
      author: 'System', from: 'RESERVED', to: 'AVAILABLE', note: 'Reservation ended after 7 days without a deal',
    });
  });
});
