import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
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

/** Resolves once the socket is open; rejects with the HTTP status if the upgrade is refused. */
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
      reject(new Error(`HTTP ${response.statusCode}`));
      socket.terminate();
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
