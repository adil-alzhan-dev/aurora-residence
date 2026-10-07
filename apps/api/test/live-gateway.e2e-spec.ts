import type { IncomingMessage } from 'node:http';
import type { INestApplication } from '@nestjs/common';
import { LiveGateway, MAX_CONNECTIONS_PER_IP } from '../src/live/live.gateway.js';
import { LiveService } from '../src/live/live.service.js';
import { createTestApp, http, reseed } from './app.js';
import {
  connectLive,
  connectRaw,
  listenForLive,
  pause,
  waitFor,
  within,
  type LiveConnection,
} from './live-client.js';

describe('Live socket (e2e)', () => {
  let app: INestApplication;
  let url: string;
  const open: LiveConnection[] = [];

  const connect = async (options?: Parameters<typeof connectLive>[1]) => {
    const connection = await connectLive(url, options);
    open.push(connection);
    return connection;
  };
  const fromIp = (ip: string) => ({ headers: { 'X-Forwarded-For': ip } });

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
    const first = [];
    for (let i = 0; i < MAX_CONNECTIONS_PER_IP; i += 1) first.push(await connect(fromIp('203.0.113.7')));

    await expect(connect(fromIp('203.0.113.7'))).rejects.toThrow('HTTP 429');

    // Only the address nginx appended counts, a spoofed first entry does not.
    const other = await connect(fromIp('203.0.113.7, 198.51.100.4'));
    expect(other.socket.readyState).toBe(other.socket.OPEN);

    first[0].socket.close();
    await first[0].closed;
    await waitFor(() => app.get(LiveGateway).slotsInUse('203.0.113.7') < MAX_CONNECTIONS_PER_IP);
    const again = await connect(fromIp('203.0.113.7'));
    await pause(50);
    expect(again.socket.readyState).toBe(again.socket.OPEN);
  });

  it('drops over-limit clients that ignore Close at the handshake and never leaks a slot', async () => {
    const gateway = app.get(LiveGateway);
    const ip = '203.0.113.9';
    const regular: LiveConnection[] = [];
    for (let i = 0; i < MAX_CONNECTIONS_PER_IP; i += 1) regular.push(await connect(fromIp(ip)));

    for (const raw of [connectRaw(url, ip), connectRaw(url, ip), connectRaw(url, ip)]) {
      await within(raw.ended, 1000, 'Closing the over-limit connection');
      expect(await raw.status).toBe('HTTP/1.1 429 Too Many Requests');
    }
    expect(gateway.slotsInUse(ip)).toBe(MAX_CONNECTIONS_PER_IP);
    expect(gateway.connectionCount()).toBe(MAX_CONNECTIONS_PER_IP);

    gateway.broadcast('ping-all');
    await waitFor(() => regular.every(({ messages }) => messages.includes('ping-all')));

    for (const { socket } of regular) socket.terminate();
    for (let i = 0; i < 3; i += 1) connectRaw(url, ip).destroy();
    await waitFor(() => gateway.slotsInUse(ip) === 0 && gateway.connectionCount() === 0);

    const accepted = connectRaw(url, ip);
    expect(await accepted.status).toBe('HTTP/1.1 101 Switching Protocols');
    expect(gateway.slotsInUse(ip)).toBe(1);
    accepted.destroy();
    await waitFor(() => gateway.slotsInUse(ip) === 0 && gateway.connectionCount() === 0);

    for (let i = 0; i < MAX_CONNECTIONS_PER_IP; i += 1) await connect(fromIp(ip));
    expect(gateway.slotsInUse(ip)).toBe(MAX_CONNECTIONS_PER_IP);
  });

  it('frees the slot when TCP drops after the slot is reserved but before the upgrade', async () => {
    const gateway = app.get(LiveGateway);
    const ip = '203.0.113.11';
    const withSlots = gateway as unknown as { reserveSlot(ip: string, request: IncomingMessage): boolean };
    const reserve = withSlots.reserveSlot.bind(gateway);
    const slotsWhenDropped: number[] = [];
    const spy = jest.spyOn(withSlots, 'reserveSlot').mockImplementationOnce((address, request) => {
      const reserved = reserve(address, request);
      slotsWhenDropped.push(gateway.slotsInUse(address));
      request.socket.destroy();
      return reserved;
    });

    const raw = connectRaw(url, ip);
    await within(raw.ended, 1000, 'Dropping the TCP connection');
    spy.mockRestore();
    expect(slotsWhenDropped).toEqual([1]);
    expect(await Promise.race([raw.status, pause(0).then(() => 'no answer')])).toBe('no answer');
    await waitFor(() => gateway.slotsInUse(ip) === 0 && gateway.connectionCount() === 0);

    const again = await connect(fromIp(ip));
    expect(again.socket.readyState).toBe(again.socket.OPEN);
    expect(gateway.slotsInUse(ip)).toBe(1);
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
