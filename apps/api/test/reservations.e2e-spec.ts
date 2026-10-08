import type { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { ReservationsService } from '../src/reservations/reservations.service.js';
import { createTestApp, expectError, http, reseed, signIn } from './app.js';

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

    const again = await http(app).post('/api/admin/residences/7.03/reserve').set(admin()).send({ enquiryId: id });
    expectError(again, 409, 'RESIDENCE_RESERVED');
  });

  it('refuses a reservation with an enquiry about another residence', async () => {
    const id = await enquiryId('Elena Marsh');
    const response = await http(app)
      .post('/api/admin/residences/6.01/reserve')
      .set(admin())
      .send({ enquiryId: id })
      .expect(400);
    expectError(response, 400, 'ENQUIRY_RESIDENCE_MISMATCH');
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
    expectError(results.find((r) => r.status === 409)!, 409, 'RESIDENCE_RESERVED');
    expect(await activeReservations('4.06')).toBe(1);
  });

  it('releases a reservation manually', async () => {
    await http(app).post('/api/admin/residences/4.06/release').set(admin()).send({}).expect(200);
    expect((await card('4.06')).status).toBe('AVAILABLE');
    expect(await activeReservations('4.06')).toBe(0);
    const again = await http(app).post('/api/admin/residences/4.06/release').set(admin()).send({});
    expectError(again, 409, 'NO_ACTIVE_RESERVATION');
  });

  it('refuses RESERVED on PATCH and leaves the residence untouched', async () => {
    const historyBefore = (await card('6.02')).history.length;
    const response = await http(app)
      .patch('/api/admin/residences/6.02')
      .set(admin())
      .send({ status: 'RESERVED' })
      .expect(400);
    expectError(response, 400, 'VALIDATION_FAILED');
    expect(String((response.body as { message: string[] }).message)).toContain(
      'To reserve a residence, use POST /api/admin/residences/:number/reserve',
    );
    await http(app)
      .patch('/api/admin/residences/6.02')
      .set(admin())
      .send({ status: 'RESERVED', enquiryId: await enquiryId('Elena Marsh') })
      .expect(400);
    await http(app).patch('/api/admin/residences/7.02').set(admin()).send({ status: 'RESERVED' }).expect(400);
    const service = app.get(ReservationsService);
    await expect(
      prisma.$transaction((tx) => service.changeStatus(tx, { number: '6.02', to: 'RESERVED', actorId: 1 })),
    ).rejects.toThrow('can be reserved only for an enquiry');

    const residence = await card('6.02');
    expect(residence.status).toBe('AVAILABLE');
    expect(residence.history).toHaveLength(historyBefore);
    expect(await activeReservations('6.02')).toBe(0);
  });

  it('releases the reservation on PATCH RESERVED -> AVAILABLE and logs it', async () => {
    const enquiry = await enquiryId('Olivia Grant');
    await http(app).patch('/api/admin/residences/8.04').set(admin()).send({ status: 'AVAILABLE' }).expect(200);

    const residence = await card('8.04');
    expect(residence.status).toBe('AVAILABLE');
    expect(residence.reservation).toBeNull();
    expect(await activeReservations('8.04')).toBe(0);
    expect(residence.history[0]).toMatchObject({
      author: 'Maya Collins', from: 'RESERVED', to: 'AVAILABLE', note: 'Reservation released by manager',
    });
    const log = await prisma.activityLog.findFirstOrThrow({
      where: { residence: { number: '8.04' } },
      orderBy: { id: 'desc' },
    });
    expect(log.enquiryId).toBe(enquiry);
  });

  it('closes the reservation on PATCH RESERVED -> SOLD and logs it', async () => {
    const before = await prisma.reservation.findFirstOrThrow({
      where: { residence: { number: '7.04' }, releasedAt: null },
    });
    await http(app).patch('/api/admin/residences/7.04').set(admin()).send({ status: 'SOLD' }).expect(200);

    const residence = await card('7.04');
    expect(residence.status).toBe('SOLD');
    expect(residence.reservation).toBeNull();
    expect(await activeReservations('7.04')).toBe(0);
    const closed = await prisma.reservation.findUniqueOrThrow({ where: { id: before.id } });
    expect(closed.releasedAt).not.toBeNull();
    expect(residence.history[0]).toMatchObject({
      author: 'Maya Collins', from: 'RESERVED', to: 'SOLD', note: 'Contract signed',
    });
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

  it('rejects null status and priceUsd on PATCH with a field error and changes nothing', async () => {
    const before = await prisma.residence.findUniqueOrThrow({ where: { number: '6.02' } });
    const logsBefore = await prisma.activityLog.count({ where: { residenceId: before.id } });
    const cases = [
      { body: { status: null, priceUsd: 120_000 }, field: 'status', message: 'status can be AVAILABLE or SOLD here' },
      { body: { priceUsd: null, status: 'SOLD' }, field: 'priceUsd', message: 'priceUsd must be a whole number of dollars' },
    ];

    for (const { body, field, message } of cases) {
      const response = await http(app)
        .patch('/api/admin/residences/6.02')
        .set(admin())
        .send({ ...body, note: 'Must not be saved' })
        .expect(400);
      const errors = (response.body as { errors: Record<string, string> }).errors;
      expect(Object.keys(errors)).toEqual([field]);
      expect(errors[field]).toContain(message);
    }
    expect(await prisma.residence.findUniqueOrThrow({ where: { number: '6.02' } })).toEqual(before);
    expect(await prisma.activityLog.count({ where: { residenceId: before.id } })).toBe(logsBefore);
    expect(await activeReservations('6.02')).toBe(0);
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
