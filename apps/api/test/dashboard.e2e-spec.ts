import type { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp, http, reseed, signIn } from './app.js';

interface DashboardBody {
  residences: { AVAILABLE: number; RESERVED: number; SOLD: number; total: number };
  enquiries: { total: number; new: number; newToday: number };
  facade: { number: string; status: string }[];
  reservations: { residence: string; client: string | null; expiresAt: string; endingSoon: boolean }[];
  latestEnquiries: {
    id: number;
    createdAt: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    source: string;
    residence: { number: string; bedrooms: number; areaM2: number; priceUsd: number } | null;
  }[];
}

describe('Admin dashboard (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let body: DashboardBody;

  beforeAll(async () => {
    reseed();
    app = await createTestApp();
    prisma = app.get(PrismaService);
    const token = await signIn(app);
    const response = await http(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${token}`).expect(200);
    body = response.body as DashboardBody;
  });

  afterAll(async () => {
    await app.close();
  });

  it('answers 401 without a token', async () => {
    await http(app).get('/api/admin/dashboard').expect(401);
  });

  it('returns only the blocks the dashboard shows', () => {
    expect(Object.keys(body).sort()).toEqual(['enquiries', 'facade', 'latestEnquiries', 'reservations', 'residences']);
    expect(Object.keys(body.enquiries).sort()).toEqual(['new', 'newToday', 'total']);
  });

  it('counts residences by status as in the demo data', () => {
    expect(body.residences).toEqual({ AVAILABLE: 41, RESERVED: 8, SOLD: 17, total: 66 });
  });

  it('counts enquiries from the database', async () => {
    expect(body.enquiries.total).toBe(await prisma.enquiry.count());
    expect(body.enquiries.new).toBe(await prisma.enquiry.count({ where: { status: 'NEW' } }));
  });

  it('gives the status of all 66 residences and nothing else', () => {
    expect(body.facade).toHaveLength(66);
    for (const cell of body.facade) expect(Object.keys(cell).sort()).toEqual(['number', 'status']);
    expect(new Set(body.facade.map((cell) => cell.number)).size).toBe(66);
    const reserved = body.facade.filter((cell) => cell.status === 'RESERVED').length;
    expect(reserved).toBe(8);
  });

  it('lists active reservations with the client, soonest first, without released ones', () => {
    const { reservations } = body;
    expect(reservations).toHaveLength(8);
    expect(reservations.map((r) => r.client)).not.toContain('Henrik Larsen');
    const reservedNumbers = body.facade.filter((cell) => cell.status === 'RESERVED').map((cell) => cell.number);
    expect(reservations.map((r) => r.residence).sort()).toEqual(reservedNumbers.sort());
    for (const reservation of reservations) {
      expect(Object.keys(reservation).sort()).toEqual(['client', 'endingSoon', 'expiresAt', 'residence']);
      expect(typeof reservation.client).toBe('string');
      const msLeft = Date.parse(reservation.expiresAt) - Date.now();
      expect(msLeft).toBeGreaterThan(0);
      expect(reservation.endingSoon).toBe(msLeft <= 48 * 60 * 60 * 1000);
    }
    const expiries = reservations.map((r) => Date.parse(r.expiresAt));
    expect(expiries).toEqual([...expiries].sort((a, b) => a - b));
  });

  it('shows the 5 latest enquiries, newest first, with source and residence details', async () => {
    const { latestEnquiries } = body;
    const newest = await prisma.enquiry.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 5,
      select: { id: true },
    });
    expect(latestEnquiries.map((e) => e.id)).toEqual(newest.map((e) => e.id));

    const dates = latestEnquiries.map((e) => Date.parse(e.createdAt));
    expect(dates).toEqual([...dates].sort((a, b) => b - a));

    for (const enquiry of latestEnquiries) {
      expect(Object.keys(enquiry).sort()).toEqual(
        ['createdAt', 'email', 'id', 'name', 'phone', 'residence', 'source', 'status'],
      );
      expect(enquiry.source).toEqual(expect.any(String));
    }
  });

  it('marks an enquiry without a residence as general and keeps residence details otherwise', async () => {
    const general = await prisma.enquiry.create({
      data: {
        name: 'Ines Duarte',
        phone: '+1 555 010 3090',
        email: 'ines@example.com',
        comment: '',
        source: 'Contacts form',
      },
    });
    const token = await signIn(app);
    const response = await http(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${token}`).expect(200);
    const [first, ...rest] = (response.body as DashboardBody).latestEnquiries;

    expect(first).toMatchObject({ id: general.id, residence: null, source: 'Contacts form', status: 'NEW' });
    expect((response.body as DashboardBody).enquiries.newToday).toBeGreaterThanOrEqual(1);

    const linked = rest.find((enquiry) => enquiry.residence !== null)?.residence;
    if (!linked) throw new Error('The demo data should have a recent enquiry about a residence');
    const residence = await prisma.residence.findUniqueOrThrow({ where: { number: linked.number } });
    expect(linked).toEqual({
      number: residence.number,
      bedrooms: residence.bedrooms,
      areaM2: residence.areaM2.toNumber(),
      priceUsd: residence.priceUsd,
    });
  });
});
