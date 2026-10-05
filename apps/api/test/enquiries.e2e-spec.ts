import type { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp, http, reseed } from './app.js';

interface ValidationBody {
  statusCode: number;
  error: string;
  message: string[];
  errors: Record<string, string>;
}

const contactsEnquiry = {
  name: 'Clara Whitfield',
  phone: '+44 20 7946 0958',
  email: 'Clara.Whitfield@example.com',
  comment: 'Please send the price list',
  source: 'Contacts form',
  consent: true,
};

const without = (field: keyof typeof contactsEnquiry) =>
  Object.fromEntries(Object.entries(contactsEnquiry).filter(([key]) => key !== field));

describe('POST /api/enquiries (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let lastIp = 0;

  beforeAll(async () => {
    reseed();
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  // Every request comes from its own address so the 10 per 10 minutes limit does not interfere.
  const post = (body: object) =>
    http(app).post('/api/enquiries').set('X-Forwarded-For', `10.20.0.${++lastIp}`).send(body);

  const expectFieldError = async (body: object, field: string) => {
    const response = await post(body).expect(400);
    const error = response.body as ValidationBody;
    expect(error).toMatchObject({ statusCode: 400, error: 'Bad Request' });
    expect(error.message).toEqual(expect.arrayContaining([error.errors[field]]));
    return error.errors[field];
  };

  it('saves an enquiry without a residence', async () => {
    const response = await post(contactsEnquiry).expect(201);
    expect(response.body).toEqual({ received: true, residence: null });

    const saved = await prisma.enquiry.findFirstOrThrow({
      where: { name: 'Clara Whitfield' },
      include: { activity: true },
    });
    expect(saved).toMatchObject({ residenceId: null, source: 'Contacts form', email: 'clara.whitfield@example.com' });
    expect(saved.activity).toEqual([
      expect.objectContaining({
        type: 'ENQUIRY_RECEIVED',
        residenceId: null,
        note: 'Enquiry received from the site, no residence selected',
      }),
    ]);
  });

  it('saves an enquiry for 7.03 from the residence page and keeps 7.03 Available', async () => {
    const body = { ...contactsEnquiry, name: 'Hugo Navarro', residence: '7.03', source: 'Residence page' };
    const response = await post(body).expect(201);
    expect(response.body).toEqual({ received: true, residence: '7.03' });

    const saved = await prisma.enquiry.findFirstOrThrow({
      where: { name: 'Hugo Navarro' },
      select: { source: true, residence: { select: { number: true, status: true } } },
    });
    expect(saved).toEqual({ source: 'Residence page', residence: { number: '7.03', status: 'AVAILABLE' } });
  });

  it('keeps the rules for a chosen residence', async () => {
    await post({ ...contactsEnquiry, residence: '7.02' }).expect(400);
    expect(await expectFieldError({ ...contactsEnquiry, residence: '12.01' }, 'residence')).toBe(
      'Residence number must look like 7.03',
    );
  });

  it('requires a source from the list', async () => {
    const message = await expectFieldError({ ...contactsEnquiry, source: 'Floor plan, Enquire' }, 'source');
    expect(message).toBe('source must be one of: Contacts form, Residence page');
    await expectFieldError(without('source'), 'source');
  });

  it('requires consent to be exactly true', async () => {
    for (const body of [without('consent'), { ...contactsEnquiry, consent: false }, { ...contactsEnquiry, consent: 'true' }]) {
      expect(await expectFieldError(body, 'consent')).toBe('Please confirm you agree to be contacted');
    }
  });

  it('limits the comment to 2000 characters', async () => {
    await expectFieldError({ ...contactsEnquiry, comment: 'a'.repeat(2001) }, 'comment');
    await post({ ...contactsEnquiry, name: 'Long Comment', comment: 'a'.repeat(2000) }).expect(201);
  });

  it('reports every invalid and unknown field by name', async () => {
    const response = await post({ ...contactsEnquiry, email: 'nope', name: 'A', status: 'NEW' }).expect(400);
    const { errors } = response.body as ValidationBody;
    expect(Object.keys(errors).sort()).toEqual(['email', 'name', 'status']);
    expect(errors.email).toBe('Enter a valid email address');
    expect(errors.status).toBe('property status should not exist');
  });

  it('allows 10 enquiries per 10 minutes from one address, then says when to retry', async () => {
    const send = () =>
      http(app).post('/api/enquiries').set('X-Forwarded-For', '10.30.0.1').send({ ...contactsEnquiry, website: 'x' });
    for (let i = 0; i < 10; i += 1) await send().expect(201);
    const response = await send().expect(429);
    expect(response.body).toEqual({ statusCode: 429, message: 'Too many requests. Please try again later.' });
    const retryAfter = Number(response.headers['retry-after']);
    expect(retryAfter).toBeGreaterThan(540);
    expect(retryAfter).toBeLessThanOrEqual(600);
  });
});
