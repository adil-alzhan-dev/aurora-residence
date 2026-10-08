import type { IncomingMessage } from 'node:http';
import type { OnModuleDestroy } from '@nestjs/common';
import { type OnGatewayConnection, type OnGatewayInit, WebSocketGateway } from '@nestjs/websockets';
import { type VerifyClientCallbackAsync, WebSocket, type WebSocketServer } from 'ws';
import { wsAllowedOrigins } from '../common/env.js';
import { ERROR_CODES, type ErrorCode } from '../common/error-codes.js';

export const LIVE_PATH = '/socket';
export const MAX_CONNECTIONS_PER_IP = 10;
export const HEARTBEAT_MS = 30_000;
// The channel is server to client only, anything a client sends is dropped.
const MAX_PAYLOAD_BYTES = 1024;

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

/** ws writes these into the raw HTTP refusal; the JSON body matches the API error format. */
function refusal(statusCode: number, code: ErrorCode, message: string) {
  return [
    statusCode,
    JSON.stringify({ statusCode, code, message }),
    { 'Content-Type': 'application/json; charset=utf-8' },
  ] as const;
}

const ORIGIN_REFUSAL = refusal(403, ERROR_CODES.FORBIDDEN, 'Origin not allowed');
const LIMIT_REFUSAL = refusal(429, ERROR_CODES.RATE_LIMITED, 'Too many connections from this address');

interface LiveClient {
  alive: boolean;
}

@WebSocketGateway({ path: LIVE_PATH, maxPayload: MAX_PAYLOAD_BYTES })
export class LiveGateway implements OnGatewayInit, OnGatewayConnection, OnModuleDestroy {
  private readonly clients = new Map<WebSocket, LiveClient>();
  /** Slots per address, held from the handshake check until the TCP socket closes. */
  private readonly slotsPerIp = new Map<string, number>();
  private heartbeat?: NodeJS.Timeout;

  constructor() {
    // Fail at startup on a malformed WS_ALLOWED_ORIGINS instead of on the first visitor.
    wsAllowedOrigins();
  }

  afterInit(server: WebSocketServer): void {
    // Bound here rather than in the decorator because the slot count lives on this instance.
    // ws reads the option on every upgrade, so the refusal is an HTTP answer before the upgrade.
    server.options.verifyClient = this.verifyClient;
    this.heartbeat = setInterval(() => this.checkAlive(), HEARTBEAT_MS);
    this.heartbeat.unref();
  }

  onModuleDestroy(): void {
    clearInterval(this.heartbeat);
  }

  handleConnection(socket: WebSocket): void {
    const client: LiveClient = { alive: true };
    this.clients.set(socket, client);
    socket.on('pong', () => {
      client.alive = true;
    });
    socket.once('close', () => this.clients.delete(socket));
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
        this.clients.delete(socket);
        continue;
      }
      client.alive = false;
      socket.ping();
    }
  }

  connectionCount(): number {
    return this.clients.size;
  }

  slotsInUse(ip: string): number {
    return this.slotsPerIp.get(ip) ?? 0;
  }

  private readonly verifyClient: VerifyClientCallbackAsync = (info, done) => {
    if (!info.origin || !wsAllowedOrigins().includes(info.origin)) {
      done(false, ...ORIGIN_REFUSAL);
      return;
    }
    if (!this.reserveSlot(clientIp(info.req), info.req)) {
      done(false, ...LIMIT_REFUSAL);
      return;
    }
    done(true);
  };

  /**
   * Synchronous, so two handshakes cannot both take the last slot. The slot is tied
   * to the TCP socket rather than the WebSocket: it comes back whether the upgrade
   * completes or not, and on close, terminate or a broken connection alike.
   */
  private reserveSlot(ip: string, request: IncomingMessage): boolean {
    const count = this.slotsInUse(ip);
    if (count >= MAX_CONNECTIONS_PER_IP || request.socket.destroyed) return false;
    this.slotsPerIp.set(ip, count + 1);
    request.socket.once('close', () => {
      const left = this.slotsInUse(ip) - 1;
      if (left > 0) this.slotsPerIp.set(ip, left);
      else this.slotsPerIp.delete(ip);
    });
    return true;
  }
}
