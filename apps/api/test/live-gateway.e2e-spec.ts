import type { INestApplication } from '@nestjs/common';
import { LiveGateway, MAX_CONNECTIONS_PER_IP } from '../src/live/live.gateway.js';
import { LiveService } from '../src/live/live.service.js';
import { createTestApp, http, reseed } from './app.js';
import { connectLive, listenForLive, pause, waitFor, type LiveConnection } from './live-client.js';

describe('Live socket (e2e)', () => {
  let app: INestApplication;
  let url: string;
  const open: LiveConnection[] = [];

  const connect = async (options?: Parameters<typeof connectLive>[1]) => {
    const connection = await connectLive(url, options);
    open.push(connection);
    return connection;
  };

  beforeAll(async () => {
    reseed();
    app = await createTestApp();
    url = await listenForLive(app);
  });

  afterEach(async () => {
    for (const { socket } of open.splice(0)) socket.terminate();
    await waitFor(() => app.get(LiveGateway).connectionCount() === 0);
  });

  afterAll(async () => {
    await app.close();
  });

  it('accepts the site origin and refuses other or missing origins with 403', async () => {
    await connect();
    await expect(connectLive(url, { origin: 'https://evil.example' })).rejects.toThrow('HTTP 403');
    await expect(connectLive(url, { origin: 'http://localhost:3000' })).rejects.toThrow('HTTP 403');
    await expect(connectLive(url, { origin: undefined })).rejects.toThrow('HTTP 403');
  });

  it('sends residence.updated with only the public fields of the residence', async () => {
    const { messages } = await connect();
    await app.get(LiveService).residenceUpdated('7.03');
    await waitFor(() => messages.length === 1);

    const event = JSON.parse(messages[0]) as { type: string; residence: Record<string, unknown> };
    expect(Object.keys(event).sort()).toEqual(['residence', 'type']);
    expect(event.type).toBe('residence.updated');
    expect(Object.keys(event.residence).sort()).toEqual(['floor', 'number', 'priceUsd', 'status', 'updatedAt']);

    const publicCard = (await http(app).get('/api/residences/7.03').expect(200)).body as Record<string, unknown>;
    expect(event.residence).toMatchObject({
      number: publicCard.number,
      floor: publicCard.floor,
      status: publicCard.status,
      priceUsd: publicCard.priceUsd,
    });
    expect(new Date(event.residence.updatedAt as string).toISOString()).toBe(event.residence.updatedAt);
    expect(messages[0]).not.toMatch(/@|\+\d|Elena|Marsh|enquir/i);
  });

  it('ignores incoming messages and closes a client that sends more than 1 KB', async () => {
    const { socket, messages } = await connect();
    socket.send('hello');
    socket.send(JSON.stringify({ event: 'residence.updated', data: { number: '7.03' } }));
    await pause(100);
    expect(socket.readyState).toBe(socket.OPEN);
    expect(messages).toEqual([]);

    await app.get(LiveService).residenceUpdated('7.03');
    await waitFor(() => messages.length === 1);

    const big = await connect();
    big.socket.send('x'.repeat(2048));
    expect((await big.closed).code).toBe(1009);
  });

  it(`keeps at most ${MAX_CONNECTIONS_PER_IP} connections per client address`, async () => {
    const fromIp = (ip: string) => ({ headers: { 'X-Forwarded-For': ip } });
    const first = [];
    for (let i = 0; i < MAX_CONNECTIONS_PER_IP; i += 1) first.push(await connect(fromIp('203.0.113.7')));

    const extra = await connect(fromIp('203.0.113.7'));
    expect(await extra.closed).toEqual({ code: 1008, reason: 'Too many connections from this address' });

    // Only the address nginx appended counts, a spoofed first entry does not.
    const other = await connect(fromIp('203.0.113.7, 198.51.100.4'));
    expect(other.socket.readyState).toBe(other.socket.OPEN);

    first[0].socket.close();
    await first[0].closed;
    const again = await connect(fromIp('203.0.113.7'));
    await pause(50);
    expect(again.socket.readyState).toBe(again.socket.OPEN);
  });

  it('terminates clients that do not answer the ping', async () => {
    const gateway = app.get(LiveGateway);
    const healthy = await connect();
    const silent = await connect({ autoPong: false });

    gateway.checkAlive();
    await pause(100);
    gateway.checkAlive();

    expect((await silent.closed).code).toBe(1006);
    expect(healthy.socket.readyState).toBe(healthy.socket.OPEN);
  });
});
