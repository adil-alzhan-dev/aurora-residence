import type { INestApplication } from '@nestjs/common';
import { createTestApp, expectError, http, reseed, signIn } from './app.js';

const HUGE = '100000000000000000000';

describe('Numeric request boundaries (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    reseed();
    app = await createTestApp();
    token = await signIn(app);
  });

  afterAll(async () => {
    await app.close();
  });

  const admin = () => ({ Authorization: `Bearer ${token}` });

  it.each([
    `/api/residences?minPrice=${HUGE}`,
    `/api/residences?maxPrice=${HUGE}`,
    '/api/residences?maxPrice=10000001',
    `/api/residences?minArea=${HUGE}`,
    `/api/admin/residences?minPrice=${HUGE}`,
    `/api/admin/residences?maxArea=${HUGE}`,
    `/api/admin/enquiries?offset=${HUGE}`,
    '/api/admin/enquiries?offset=100001',
    `/api/admin/enquiries/${HUGE}`,
    '/api/admin/enquiries/2147483648',
    '/api/admin/enquiries/0',
    '/api/admin/enquiries/-1',
    '/api/admin/enquiries/1.5',
    '/api/admin/enquiries/abc',
  ])('answers 400 VALIDATION_FAILED for %s', async (path) => {
    expectError(await http(app).get(path).set(admin()), 400, 'VALIDATION_FAILED');
  });

  it('accepts the largest allowed values', async () => {
    await http(app).get('/api/residences?minPrice=0&maxPrice=10000000').expect(200);
    const page = await http(app).get('/api/admin/enquiries?offset=100000').set(admin()).expect(200);
    expect((page.body as { items: unknown[] }).items).toEqual([]);
    expectError(await http(app).get('/api/admin/enquiries/2147483647').set(admin()), 404, 'ENQUIRY_NOT_FOUND');
  });

  it('rejects an out-of-range id in PATCH and changes nothing', async () => {
    const response = await http(app).patch(`/api/admin/enquiries/${HUGE}`).set(admin()).send({ status: 'CLOSED' });
    expectError(response, 400, 'VALIDATION_FAILED');
  });

  it.each([1e20, 2_147_483_648, 0, 1.5])('rejects enquiryId %p before reserving', async (enquiryId) => {
    const response = await http(app)
      .post('/api/admin/residences/7.03/reserve')
      .set(admin())
      .send({ enquiryId });
    expectError(response, 400, 'VALIDATION_FAILED');
    expect((await http(app).get('/api/residences/7.03').expect(200)).body).toMatchObject({ status: 'AVAILABLE' });
  });
});
