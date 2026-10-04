import type { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp, http, reseed, signIn } from './app.js';
import { TEST_ADMIN } from './test-env.js';

interface ListItem {
  id: number;
  name: string;
  residence: string | null;
  source: string;
}

interface Card extends Omit<ListItem, 'residence'> {
  residence: { number: string; status: string } | null;
  activity: { type: string; to: string | null; residence: string | null; author: string }[];
}

describe('Admin enquiries without a residence (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let lastIp = 0;

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

  const submit = async (name: string): Promise<number> => {
    await http(app)
      .post('/api/enquiries')
      .set('X-Forwarded-For', `10.40.0.${++lastIp}`)
      .send({ name, phone: '+1 555 010 2040', email: 'buyer@example.com', source: 'Contacts form', consent: true })
      .expect(201);
    return (await prisma.enquiry.findFirstOrThrow({ where: { name }, select: { id: true } })).id;
  };

  const card = async (id: number) =>
    (await http(app).get(`/api/admin/enquiries/${id}`).set(admin()).expect(200)).body as Card;

  const link = (id: number, residenceNumber: string) =>
    http(app).patch(`/api/admin/enquiries/${id}`).set(admin()).send({ residenceNumber });

  it('lists and shows an enquiry without a residence', async () => {
    const id = await submit('Freya Holm');
    const list = await http(app).get('/api/admin/enquiries?search=Freya').set(admin()).expect(200);
    expect((list.body as { items: ListItem[] }).items).toEqual([
      expect.objectContaining({ id, residence: null, source: 'Contacts form' }),
    ]);

    const filtered = await http(app).get('/api/admin/enquiries?residence=7.03&limit=100').set(admin()).expect(200);
    const items = (filtered.body as { items: ListItem[] }).items;
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.residence === '7.03')).toBe(true);

    expect(await card(id)).toMatchObject({ id, residence: null, reservation: null });
    const dashboard = await http(app).get('/api/admin/dashboard').set(admin()).expect(200);
    expect((dashboard.body as { latestEnquiries: ListItem[] }).latestEnquiries[0]).toMatchObject({ id, residence: null });
  });

  it('refuses to reserve a residence for an enquiry without one', async () => {
    const id = await submit('Pavel Antonov');
    const response = await http(app)
      .post('/api/admin/residences/6.01/reserve')
      .set(admin())
      .send({ enquiryId: id })
      .expect(400);
    expect((response.body as { message: string }).message).toContain(`Enquiry ${id} has no residence`);
    expect((await http(app).get('/api/residences/6.01').expect(200)).body).toMatchObject({ status: 'AVAILABLE' });
  });

  it('links a residence, keeps its status and logs the change', async () => {
    const id = await submit('Lucia Romano');
    const response = await link(id, '6.01').expect(200);
    const body = response.body as Card;
    expect(body.residence).toMatchObject({ number: '6.01', status: 'AVAILABLE' });
    expect(body.activity[0]).toMatchObject({
      type: 'ENQUIRY_RESIDENCE_LINKED', to: '6.01', residence: '6.01', author: 'Maya Collins',
    });
    const log = await prisma.activityLog.findFirstOrThrow({
      where: { type: 'ENQUIRY_RESIDENCE_LINKED', enquiryId: id },
      select: { toValue: true, actor: { select: { email: true } }, residence: { select: { number: true } } },
    });
    expect(log).toEqual({ toValue: '6.01', actor: { email: TEST_ADMIN.email }, residence: { number: '6.01' } });

    const again = await link(id, '6.02').expect(409);
    expect((again.body as { message: string }).message).toBe('Enquiry already has residence 6.01');
  });

  it('links together with a status and a note', async () => {
    const id = await submit('Tomas Varga');
    await http(app)
      .patch(`/api/admin/enquiries/${id}`)
      .set(admin())
      .send({ residenceNumber: '5.02', status: 'IN_PROGRESS', managerNote: 'Wants a high floor' })
      .expect(200);
    const types = (await card(id)).activity.map((entry) => entry.type);
    expect(types).toEqual(expect.arrayContaining(['ENQUIRY_RESIDENCE_LINKED', 'ENQUIRY_STATUS_CHANGED', 'NOTE_ADDED']));
  });

  it('lets only one of two parallel links through', async () => {
    const id = await submit('Ingrid Solberg');
    const results = await Promise.all([link(id, '3.01'), link(id, '3.02')]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(await prisma.activityLog.count({ where: { type: 'ENQUIRY_RESIDENCE_LINKED', enquiryId: id } })).toBe(1);
  });

  it('refuses sold, missing and malformed residences', async () => {
    const id = await submit('Mateo Cruz');
    const sold = await link(id, '7.02').expect(409);
    expect((sold.body as { message: string }).message).toBe('Residence 7.02 is sold');

    const spare = await prisma.residence.findFirstOrThrow({
      where: { enquiries: { none: {} }, reservations: { none: {} } },
      select: { number: true },
    });
    await prisma.residence.delete({ where: { number: spare.number } });
    const missing = await link(id, spare.number).expect(400);
    expect((missing.body as { message: string }).message).toBe(`Residence ${spare.number} does not exist`);

    const malformed = await link(id, '12.01').expect(400);
    expect((malformed.body as { errors: Record<string, string> }).errors.residenceNumber).toBe(
      'Residence number must look like 7.03',
    );
    expect((await card(id)).residence).toBeNull();
  });

  it('asks for at least one change and requires a token', async () => {
    const id = await submit('Elise Martin');
    const empty = await http(app).patch(`/api/admin/enquiries/${id}`).set(admin()).send({}).expect(400);
    expect((empty.body as { message: string }).message).toBe('Send a new status, managerNote or residenceNumber');
    await http(app).patch(`/api/admin/enquiries/${id}`).send({ residenceNumber: '6.01' }).expect(401);
    expect((await card(id)).residence).toBeNull();
  });
});
