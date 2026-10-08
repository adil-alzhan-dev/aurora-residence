import { randomBytes } from 'node:crypto';
import type { Server } from 'node:http';
import { type AddressInfo, connect } from 'node:net';
import type { INestApplication } from '@nestjs/common';
import WebSocket, { type ClientOptions } from 'ws';

export const ALLOWED_ORIGIN = 'http://localhost';

/** Starts the app on a random local port and returns the live socket URL. */
export async function listenForLive(app: INestApplication): Promise<string> {
  await app.listen(0, '127.0.0.1');
  const { port } = (app.getHttpServer() as Server).address() as AddressInfo;
  return `ws://127.0.0.1:${port}/socket`;
}

export interface LiveConnection {
  socket: WebSocket;
  messages: string[];
  closed: Promise<{ code: number; reason: string }>;
}

export class HandshakeRefused extends Error {
  constructor(
    readonly statusCode: number,
    readonly contentType: string | undefined,
    readonly body: string,
  ) {
    super(`HTTP ${statusCode}`);
  }
}

/** Resolves once the socket is open; rejects with HandshakeRefused if the upgrade is refused. */
export function connectLive(url: string, options: ClientOptions = {}): Promise<LiveConnection> {
  const socket = new WebSocket(url, { origin: ALLOWED_ORIGIN, ...options });
  const messages: string[] = [];
  socket.on('message', (data: Buffer) => messages.push(data.toString()));
  const closed = new Promise<{ code: number; reason: string }>((resolve) =>
    socket.on('close', (code, reason) => resolve({ code, reason: reason.toString() })),
  );
  return new Promise((resolve, reject) => {
    socket.once('open', () => resolve({ socket, messages, closed }));
    socket.once('unexpected-response', (_request, response) => {
      const chunks: Buffer[] = [];
      response.on('data', (chunk: Buffer) => chunks.push(chunk));
      response.once('end', () => {
        const body = Buffer.concat(chunks).toString();
        reject(new HandshakeRefused(response.statusCode ?? 0, response.headers['content-type'], body));
        socket.terminate();
      });
    });
    socket.once('error', reject);
  });
}

export async function waitFor(check: () => boolean, timeoutMs = 2000): Promise<void> {
  const started = Date.now();
  while (!check()) {
    if (Date.now() - started > timeoutMs) throw new Error('Timed out waiting for the live socket');
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

export const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface RawConnection {
  /** The HTTP status line the server answered the handshake with. */
  status: Promise<string>;
  /** Resolves when the server ends or drops the TCP connection. */
  ended: Promise<void>;
  /** Everything the server sent before the connection ended. */
  received: () => string;
  destroy: () => void;
}

/**
 * A client on bare TCP that sends a valid upgrade request and then never writes
 * again, so it ignores a Close frame the way a hostile client would.
 */
export function connectRaw(url: string, forwardedFor: string): RawConnection {
  const { hostname, port, pathname } = new URL(url);
  const socket = connect(Number(port), hostname);
  socket.write(
    [
      `GET ${pathname} HTTP/1.1`,
      `Host: ${hostname}:${port}`,
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Key: ${randomBytes(16).toString('base64')}`,
      'Sec-WebSocket-Version: 13',
      `Origin: ${ALLOWED_ORIGIN}`,
      `X-Forwarded-For: ${forwardedFor}`,
      '',
      '',
    ].join('\r\n'),
  );
  socket.on('error', () => undefined);
  const status = new Promise<string>((resolve) =>
    socket.once('data', (chunk: Buffer) => resolve(chunk.toString().split('\r\n')[0])),
  );
  let received = '';
  socket.on('data', (chunk: Buffer) => (received += chunk.toString()));
  const ended = new Promise<void>((resolve) => socket.once('close', () => resolve()));
  return { status, ended, received: () => received, destroy: () => socket.destroy() };
}

/** Rejects if the promise has not settled within the given time. */
export function within<T>(promise: Promise<T>, ms: number, what: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${what} did not happen within ${ms} ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
