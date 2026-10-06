import type { ReactNode } from "react";

import type { AdminDictionary } from "@/content/en-admin";
import type { AdminResidence } from "@/lib/admin/schemas";
import { fillTemplate } from "@/lib/format";
import { cn } from "@/lib/utils";

import { ResidenceRow } from "./residence-row";

type TableProps = {
  items: AdminResidence[];
  t: AdminDictionary["residences"];
  renderStatus: (residence: AdminResidence) => ReactNode;
};

const head = "h-10 px-0 text-left text-label font-semibold text-muted-foreground";

export function ResidencesTable({ items, t, renderStatus }: TableProps) {
  const { columns } = t;
  return (
    <div className="overflow-x-auto rounded-base border border-border bg-card">
      <table className="w-full border-collapse">
        <caption className="sr-only">{fillTemplate(t.tableLabel, { shown: items.length })}</caption>
        <thead className="border-b border-border bg-background">
          <tr>
            <th scope="col" className={cn(head, "pl-4 md:w-50")}>
              {columns.residence}
            </th>
            <th scope="col" className={cn(head, "hidden w-25 md:table-cell")}>
              {columns.floor}
            </th>
            <th scope="col" className={cn(head, "hidden w-30 md:table-cell")}>
              {columns.bedrooms}
            </th>
            <th scope="col" className={cn(head, "hidden w-30 md:table-cell")}>
              {columns.area}
            </th>
            <th scope="col" className={cn(head, "pr-4 md:w-40")}>
              {columns.price}
            </th>
            <th scope="col" className={cn(head, "pr-4 md:w-49")}>
              {columns.status}
            </th>
            <th scope="col" className={cn(head, "hidden w-35 lg:table-cell")}>
              {columns.updated}
            </th>
            <th scope="col" className={cn(head, "hidden sm:table-cell")}>
              <span className="sr-only">{columns.action}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((residence) => (
            <ResidenceRow key={residence.number} residence={residence} t={t} statusCell={renderStatus(residence)} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
