import { ChevronDownIcon } from "@/components/icons";
import type { Residence } from "@/lib/api/residences";
import { fillTemplate } from "@/lib/format";
import type { ResidenceSort } from "@/lib/residence-sort";
import { cn } from "@/lib/utils";

import { ListRow, type ListRowText } from "./list-row";

type ListTableProps = {
  residences: Residence[];
  sort: ResidenceSort;
  onSort: (sort: ResidenceSort) => void;
  t: ListRowText;
};

type SortColumn = {
  key: "area" | "price" | "status";
  /** Sort order of the column, or null when the column is not the one the list is sorted by. */
  direction: "ascending" | "descending" | null;
  next: ResidenceSort;
};

function sortColumns(sort: ResidenceSort): SortColumn[] {
  return [
    { key: "area", direction: sort === "area-desc" ? "descending" : null, next: "area-desc" },
    {
      key: "price",
      direction: sort === "price-asc" ? "ascending" : sort === "price-desc" ? "descending" : null,
      next: sort === "price-asc" ? "price-desc" : "price-asc",
    },
    { key: "status", direction: sort === "available" ? "ascending" : null, next: "available" },
  ];
}

const th = "pb-4 text-left text-label font-semibold text-muted-foreground";

/** Desktop table from the Residences / List frame; Area, Price and Status headers also sort. */
export function ListTable({ residences, sort, onSort, t }: ListTableProps) {
  const columns = t.list.columns;
  const [area, price, status] = sortColumns(sort);

  const sortHeader = (column: SortColumn, className: string) => (
    <th scope="col" aria-sort={column.direction ?? undefined} className={cn(th, className)}>
      <button
        type="button"
        onClick={() => onSort(column.next)}
        aria-label={fillTemplate(t.list.sortByColumn, { column: columns[column.key] })}
        className={cn(
          "inline-flex items-center gap-1.5 uppercase transition-colors duration-200 hover:text-foreground",
          column.direction && "text-foreground",
        )}
      >
        {columns[column.key]}
        <ChevronDownIcon
          className={cn("size-3", !column.direction && "opacity-50", column.direction === "ascending" && "rotate-180")}
        />
      </button>
    </th>
  );

  return (
    <table className="w-full table-fixed border-collapse">
      <caption className="sr-only">{t.list.title}</caption>
      <thead>
        <tr className="border-b border-border">
          <th scope="col" className={cn(th, "hidden w-[168px] pl-4 xl:table-cell")}>
            {columns.plan}
          </th>
          <th scope="col" className={cn(th, "w-[204px] pl-4 xl:w-[220px] xl:pl-0")}>
            {columns.residence}
          </th>
          <th scope="col" className={cn(th, "w-[84px] xl:w-[112px]")}>
            {columns.floor}
          </th>
          <th scope="col" className={cn(th, "w-[96px] xl:w-[112px]")}>
            {columns.bedrooms}
          </th>
          {sortHeader(area, "w-[96px] xl:w-[136px]")}
          {sortHeader(price, "w-[120px] xl:w-[160px]")}
          {sortHeader(status, "w-[136px] xl:w-[168px]")}
          <th scope="col" className={th}>
            <span className="sr-only">{columns.action}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {residences.map((residence) => (
          <ListRow key={residence.number} residence={residence} t={t} />
        ))}
      </tbody>
    </table>
  );
}
