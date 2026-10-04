import type { Prisma } from '../generated/prisma/client.js';
import type { ActivityType } from '../generated/prisma/enums.js';

export const ACTIVITY_SELECT = {
  type: true,
  fromValue: true,
  toValue: true,
  note: true,
  createdAt: true,
  actor: { select: { name: true } },
  residence: { select: { number: true } },
} satisfies Prisma.ActivityLogSelect;

type ActivityRow = Prisma.ActivityLogGetPayload<{ select: typeof ACTIVITY_SELECT }>;

export interface ActivityEntry {
  at: Date;
  type: ActivityType;
  from: string | null;
  to: string | null;
  note: string | null;
  residence: string | null;
  author: string;
}

export function toActivityEntry(row: ActivityRow): ActivityEntry {
  return {
    at: row.createdAt,
    type: row.type,
    from: row.fromValue,
    to: row.toValue,
    note: row.note,
    residence: row.residence?.number ?? null,
    author: row.actor?.name ?? 'System',
  };
}
