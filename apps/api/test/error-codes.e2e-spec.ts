import { type INestApplication, Logger } from '@nestjs/common';
import { HealthService } from '../src/health/health.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { ResidencesService } from '../src/residences/residences.service.js';
import { createTestApp, expectError, http, reseed, signIn } from './app.js';

const MISSING_ID = 999_999;

describe('Error codes of the API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;

  beforeAll(async () => {
    reseed();
    app = await createTestApp();
    prisma = app.get(PrismaService);
    token = await signIn(app);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  const admin = () => ({ Authorization: `Bearer ${token}` });
  const reserve = (number: string, enquiryId: number) =>
    http(app).post(`/api/admin/residences/${number}/reserve`).set(admin()).send({ enquiryId });

  it('answers ENQUIRY_NOT_FOUND for a missing enquiry on the card, PATCH and reservation', async () => {
    expectError(await http(app).get(`/api/admin/enquiries/${MISSING_ID}`).set(admin()), 404, 'ENQUIRY_NOT_FOUND');
    const patch = await http(app).patch(`/api/admin/enquiries/${MISSING_ID}`).set(admin()).send({ status: 'CLOSED' });
    expectError(patch, 404, 'ENQUIRY_NOT_FOUND');
    expectError(await reserve('6.01', MISSING_ID), 404, 'ENQUIRY_NOT_FOUND');
  });

  it('refuses to reserve for a closed enquiry with ENQUIRY_CLOSED', async () => {
    const enquiry = await prisma.enquiry.create({
      data: {
        name: 'Closed Buyer',
        phone: '+1 555 010 3030',
        email: 'closed.buyer@example.com',
        comment: 'Changed my mind',
        source: 'Residence page',
        status: 'CLOSED',
        residence: { connect: { number: '6.01' } },
      },
      select: { id: true },
    });
    const response = await reserve('6.01', enquiry.id);
    expectError(response, 400, 'ENQUIRY_CLOSED');
    expect((await prisma.residence.findUniqueOrThrow({ where: { number: '6.01' } })).status).toBe('AVAILABLE');
  });

  it('refuses to reserve a sold residence with RESIDENCE_SOLD', async () => {
    const enquiry = await prisma.enquiry.findFirstOrThrow({ where: { name: 'Elena Marsh' }, select: { id: true } });
    expectError(await reserve('7.02', enquiry.id), 409, 'RESIDENCE_SOLD');
  });

  it('asks for a change on an empty residence PATCH with NOTHING_TO_UPDATE', async () => {
    const response = await http(app).patch('/api/admin/residences/6.01').set(admin()).send({});
    expectError(response, 400, 'NOTHING_TO_UPDATE');
  });

  it('answers RESIDENCE_NOT_FOUND for a residence that is gone', async () => {
    const spare = await prisma.residence.findFirstOrThrow({
      where: { enquiries: { none: {} }, reservations: { none: {} }, activity: { none: {} } },
      select: { number: true },
    });
    await prisma.residence.delete({ where: { number: spare.number } });

    expectError(await http(app).get(`/api/residences/${spare.number}`), 404, 'RESIDENCE_NOT_FOUND');
    expectError(await http(app).get(`/api/admin/residences/${spare.number}`).set(admin()), 404, 'RESIDENCE_NOT_FOUND');
    const patch = await http(app).patch(`/api/admin/residences/${spare.number}`).set(admin()).send({ priceUsd: 100_000 });
    expectError(patch, 404, 'RESIDENCE_NOT_FOUND');
    const enquiry = await http(app)
      .post('/api/enquiries')
      .set('X-Forwarded-For', '10.60.0.1')
      .send({
        name: 'Late Buyer',
        phone: '+1 555 010 4040',
        email: 'late.buyer@example.com',
        source: 'Residence page',
        residence: spare.number,
        consent: true,
      });
    expectError(enquiry, 404, 'RESIDENCE_NOT_FOUND');
  });

  it('gives errors without a specific code the general code of their status', async () => {
    const unknownRoute = await http(app).get('/api/nothing-here');
    expect(unknownRoute.body).toEqual({ statusCode: 404, code: 'NOT_FOUND', message: 'Cannot GET /api/nothing-here' });

    expectError(await http(app).get('/api/admin/enquiries/abc').set(admin()), 400, 'BAD_REQUEST');
    const brokenJson = await http(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ');
    expectError(brokenJson, 400, 'BAD_REQUEST');

    const huge = await http(app)
      .post('/api/enquiries')
      .set('X-Forwarded-For', '10.60.0.2')
      .send({ comment: 'a'.repeat(200_000) });
    expectError(huge, 413, 'PAYLOAD_TOO_LARGE');
  });

  it('hides the details of an unexpected failure behind INTERNAL_ERROR and logs them', async () => {
    const logged = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest
      .spyOn(app.get(ResidencesService), 'list')
      .mockRejectedValue(new Error('connect ECONNREFUSED postgres://aurora:secret@db:5432'));

    const response = await http(app).get('/api/residences');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ statusCode: 500, code: 'INTERNAL_ERROR', message: 'Internal server error' });
    expect(response.text).not.toMatch(/secret|ECONNREFUSED|stack/);
    expect(logged).toHaveBeenCalledWith(
      expect.stringContaining('ECONNREFUSED'),
      expect.stringContaining('at '),
    );
  });

  it('keeps the health answer useful for the healthcheck when the database is down', async () => {
    jest.spyOn(app.get(HealthService), 'isDatabaseUp').mockResolvedValue(false);

    const response = await http(app).get('/api/health');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      statusCode: 503,
      code: 'SERVICE_UNAVAILABLE',
      message: 'Service temporarily unavailable',
      status: 'error',
      database: 'down',
    });
  });
});
