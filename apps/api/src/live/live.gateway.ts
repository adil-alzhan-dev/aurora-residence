import type { IncomingMessage } from 'node:http';
import type { OnModuleDestroy } from '@nestjs/common';
import { type OnGatewayConnection, type OnGatewayInit, WebSocketGateway } from '@nestjs/websockets';
import { WebSocket } from 'ws';
import { wsAllowedOrigins } from '../common/env.js';

export const LIVE_PATH = '/socket';
export const MAX_CONNECTIONS_PER_IP = 10;
export const HEARTBEAT_MS = 30_000;
// The channel is server to client only, anything a client sends is dropped.
const MAX_PAYLOAD_BYTES = 1024;
const POLICY_VIOLATION = 1008;

interface VerifyInfo {
  origin: string | undefined;
}

type VerifyDone = (result: boolean, code?: number, message?: string) => void;

function verifyOrigin(info: VerifyInfo, done: VerifyDone): void {
  const allowed = info.origin !== undefined && wsAllowedOrigins().includes(info.origin);
  if (allowed) done(true);
  else done(false, 403, 'Origin not allowed');
}

/**
 * app.setup.ts trusts exactly one proxy hop (nginx), so the client is the last
 * X-Forwarded-For entry, the same address Express reports as req.ip.
 */
export function clientIp(request: IncomingMessage): string {
  const header = request.headers['x-forwarded-for'];
  const forwarded = Array.isArray(header) ? header.join(',') : header;
  const last = forwarded?.split(',').pop()?.trim();
  return last || request.socket.remoteAddress || 'unknown';
}

interface LiveClient {
  ip: string;
  alive: boolean;
}

@WebSocketGateway({ path: LIVE_PATH, maxPayload: MAX_PAYLOAD_BYTES, verifyClient: verifyOrigin })
export class LiveGateway implements OnGatewayInit, OnGatewayConnection, OnModuleDestroy {
  private readonly clients = new Map<WebSocket, LiveClient>();
  private readonly connectionsPerIp = new Map<string, number>();
  private heartbeat?: NodeJS.Timeout;

  constructor() {
    // Fail at startup on a malformed WS_ALLOWED_ORIGINS instead of on the first visitor.
    wsAllowedOrigins();
  }

  afterInit(): void {
    this.heartbeat = setInterval(() => this.checkAlive(), HEARTBEAT_MS);
    this.heartbeat.unref();
  }

  onModuleDestroy(): void {
    clearInterval(this.heartbeat);
  }

  handleConnection(socket: WebSocket, request: IncomingMessage): void {
    const ip = clientIp(request);
    const count = this.connectionsPerIp.get(ip) ?? 0;
    if (count >= MAX_CONNECTIONS_PER_IP) {
      socket.close(POLICY_VIOLATION, 'Too many connections from this address');
      return;
    }
    this.connectionsPerIp.set(ip, count + 1);
    const client: LiveClient = { ip, alive: true };
    this.clients.set(socket, client);
    socket.on('pong', () => {
      client.alive = true;
    });
    socket.once('close', () => this.forget(socket));
  }

  broadcast(message: string): void {
    for (const socket of this.clients.keys()) {
      if (socket.readyState === WebSocket.OPEN) socket.send(message);
    }
  }

  /** Terminates clients that missed the previous ping, pings the rest. */
  checkAlive(): void {
    for (const [socket, client] of this.clients) {
      if (!client.alive) {
        socket.terminate();
        this.forget(socket);
        continue;
      }
      client.alive = false;
      socket.ping();
    }
  }

  connectionCount(): number {
    return this.clients.size;
  }

  private forget(socket: WebSocket): void {
    const client = this.clients.get(socket);
    if (!client) return;
    this.clients.delete(socket);
    const left = (this.connectionsPerIp.get(client.ip) ?? 1) - 1;
    if (left > 0) this.connectionsPerIp.set(client.ip, left);
    else this.connectionsPerIp.delete(client.ip);
  }
}
