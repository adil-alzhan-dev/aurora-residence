import type { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp, http, reseed } from './app.js';

const PUBLIC_RESIDENCE_KEYS = [
  'areaM2', 'bedrooms', 'floor', 'isPenthouse', 'layout', 'number',
  'position', 'priceUsd', 'side', 'status', 'view',
];

interface Residence {
  number: string;
  status: string;
  priceUsd: number;
}

describe('Public API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    reseed();
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists residences Available first, then by price, with public fields only', async () => {
    const response = await http(app).get('/api/residences').expect(200);
    const residences = response.body as Residence[];
    expect(residences).toHaveLength(66);
    expect(Object.keys(residences[0]).sort()).toEqual(PUBLIC_RESIDENCE_KEYS);

    const statuses = residences.map((r) => r.status);
    expect(statuses.lastIndexOf('AVAILABLE')).toBe(40);
    expect(statuses.indexOf('SOLD')).toBe(49);
    const available = residences.slice(0, 41).map((r) => r.priceUsd);
    expect(available).toEqual([...available].sort((a, b) => a - b));
  });

  it('filters by bedrooms, status and price', async () => {
    const response = await http(app)
      .get('/api/residences?bedrooms=2&status=AVAILABLE&maxPrice=300000')
      .expect(200);
    const residences = response.body as Residence[];
    expect(residences).toHaveLength(14);
    expect(residences[0]).toMatchObject({ number: '2.03', priceUsd: 198_000 });
    await http(app).get('/api/residences?status=FREE').expect(400);
  });

  it('returns one residence by number and 404 / 400 for bad numbers', async () => {
    const response = await http(app).get('/api/residences/7.03').expect(200);
    expect(response.body).toMatchObject({ number: '7.03', bedrooms: 2, areaM2: 84.2, priceUsd: 218_000 });
    expect(Object.keys(response.body as object).sort()).toEqual(PUBLIC_RESIDENCE_KEYS);
    await http(app).get('/api/residences/7.07').expect(400);
  });

  it('summarises a floor', async () => {
    const response = await http(app).get('/api/floors/7').expect(200);
    expect(response.body).toMatchObject({ floor: 7, total: 6, available: 4, fromPriceUsd: 95_000 });
    await http(app).get('/api/floors/12').expect(400);
    const floors = await http(app).get('/api/floors').expect(200);
    expect(floors.body).toHaveLength(11);
  });

  it('returns fixed currency rates', async () => {
    const response = await http(app).get('/api/rates').expect(200);
    const body = response.body as { base: string; rates: { code: string; perUsd: number }[] };
    expect(body.base).toBe('USD');
    expect(body.rates).toEqual([
      { code: 'USD', perUsd: 1 },
      { code: 'EUR', perUsd: 0.92 },
      { code: 'KZT', perUsd: 505 },
    ]);
  });

  describe('POST /api/enquiries', () => {
    const enquiry = {
      name: 'Test Buyer',
      phone: '+1 (555) 010-0000',
      email: 'test.buyer@example.com',
      comment: 'Interested in a viewing',
      residence: '6.01',
      source: 'Residence page',
      consent: true,
    };

    it('saves the enquiry and leaves the residence Available without a reservation', async () => {
      const before = await prisma.enquiry.count();
      const response = await http(app).post('/api/enquiries').send(enquiry).expect(201);
      expect(response.body).toEqual({ received: true, residence: '6.01' });

      expect(await prisma.enquiry.count()).toBe(before + 1);
      const residence = await prisma.residence.findUniqueOrThrow({
        where: { number: '6.01' },
        select: { status: true, reservations: { where: { releasedAt: null } } },
      });
      expect(residence.status).toBe('AVAILABLE');
      expect(residence.reservations).toHaveLength(0);
    });

    it('logs the actual residence status with the enquiry', async () => {
      await http(app).post('/api/enquiries').send({ ...enquiry, residence: '7.04' }).expect(201);
      const log = await prisma.activityLog.findFirstOrThrow({
        where: { type: 'ENQUIRY_RECEIVED', enquiry: { residence: { number: '7.04' } } },
        orderBy: { id: 'desc' },
      });
      expect(log.note).toBe('Enquiry received from the site, residence 7.04 is Reserved, status not changed');
    });

    it('silently drops a submission with the honeypot filled', async () => {
      const before = await prisma.enquiry.count();
      const response = await http(app)
        .post('/api/enquiries')
        .send({ ...enquiry, website: 'http://spam.example' })
        .expect(201);
      expect(response.body).toEqual({ received: true, residence: '6.01' });
      expect(await prisma.enquiry.count()).toBe(before);
    });

    it('rejects a sold residence, invalid fields and unknown fields', async () => {
      const sold = await http(app).post('/api/enquiries').send({ ...enquiry, residence: '7.02' }).expect(400);
      expect((sold.body as { message: string }).message).toMatch(/already sold/);
      await http(app).post('/api/enquiries').send({ ...enquiry, email: 'nope' }).expect(400);
      for (const phone of ['-------', '+ () - -', '555 010 2040', '+1 23', '+1234567890123456']) {
        await http(app).post('/api/enquiries').set('X-Forwarded-For', '10.9.0.1').send({ ...enquiry, phone }).expect(400);
      }
      await http(app).post('/api/enquiries').send({ ...enquiry, status: 'RESERVED' }).expect(400);
    });
  });
});
