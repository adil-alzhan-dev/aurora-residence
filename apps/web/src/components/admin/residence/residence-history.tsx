import { useAdminFormat } from "@/components/admin/admin-locale";
import { ResidenceStatusBadge } from "@/components/admin/residences/residence-row";
import type { AdminDictionary } from "@/content/en-admin";
import { authorText, noteText } from "@/lib/admin/api-texts";
import type { ActivityEntry, AdminResidenceStatus } from "@/lib/admin/schemas";

import { AdminCard } from "./admin-card";

const STATUSES = new Set(["AVAILABLE", "RESERVED", "SOLD"]);
const isStatus = (value: string | null): value is AdminResidenceStatus => value !== null && STATUSES.has(value);

type Statuses = AdminDictionary["facade"]["statuses"];

function Change({ entry, statuses }: { entry: ActivityEntry; statuses: Statuses }) {
  const format = useAdminFormat();
  const arrow = (
    <span aria-hidden="true" className="text-admin-body text-muted-foreground">
      →
    </span>
  );
  if (entry.type === "PRICE_CHANGED") {
    return (
      <span className="flex flex-wrap items-center gap-2 text-admin-strong text-foreground">
        {entry.from && <span>{format.price(Number(entry.from))}</span>}
        {entry.from && arrow}
        <span>{format.price(Number(entry.to))}</span>
      </span>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-2">
      {isStatus(entry.from) && <ResidenceStatusBadge status={entry.from} statuses={statuses} />}
      {isStatus(entry.from) && arrow}
      {isStatus(entry.to) && <ResidenceStatusBadge status={entry.to} statuses={statuses} />}
    </span>
  );
}

type HistoryProps = {
  history: ActivityEntry[];
  t: AdminDictionary["residence"]["history"];
  statuses: Statuses;
  messages: AdminDictionary["messages"];
};

/** Only status and price changes: enquiry events belong to the enquiry screen. */
export function ResidenceHistory({ history, t, statuses, messages }: HistoryProps) {
  const format = useAdminFormat();
  const entries = history.filter((entry) => entry.type === "STATUS_CHANGED" || entry.type === "PRICE_CHANGED");
  return (
    <AdminCard id="residence-history" title={t.title} className="gap-3">
      {entries.length === 0 ? (
        <p className="border-t border-border pt-3 text-admin-body text-muted-foreground">{t.empty}</p>
      ) : (
        <ol className="flex flex-col">
          {entries.map((entry) => (
            <li
              key={`${entry.at.toISOString()}-${entry.type}`}
              className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-t border-border py-3 md:flex"
            >
              <time dateTime={entry.at.toISOString()} className="text-admin-caption text-muted-foreground md:w-37.5 md:shrink-0">
                {format.dayTime(entry.at)}
              </time>
              <span className="text-admin-caption text-muted-foreground md:order-last md:shrink-0">{authorText(entry.author, messages)}</span>
              <span className="col-span-2 md:w-65 md:shrink-0">
                <Change entry={entry} statuses={statuses} />
              </span>
              <span className="col-span-2 text-admin-body text-foreground md:min-w-0 md:flex-1">{entry.note && noteText(entry.note, { messages, statuses }, format)}</span>
            </li>
          ))}
        </ol>
      )}
    </AdminCard>
  );
}
