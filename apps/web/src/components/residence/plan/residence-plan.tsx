import { ArrowRightIcon } from "@/components/icons";
import type { Dictionary } from "@/content";
import type { Residence } from "@/lib/api/residences";
import { fillTemplate, formatArea } from "@/lib/format";
import type { Room } from "@/lib/residence-layouts";
import { cn } from "@/lib/utils";

import { PlanDimensions } from "./plan-dimensions";
import { planAspect, ResidenceDrawing, wallPad } from "./plan-drawing";
import { planGeometry, toPlan } from "./plan-geometry";

type ResidencePlanProps = {
  residence: Residence;
  layout: { rooms: Room[]; widthM: number; depthM: number; ceilingM: number; terraceM2: number | null };
  t: Dictionary["residencePage"];
  sides: Dictionary["list"]["sides"];
};

const areaText = (areaM2: number) => `${formatArea(areaM2)} m²`;

const COMPACT_WIDTH_M = 12;
const SMALL_ROOM_M2 = 8;

export function ResidencePlan({ residence, layout, t, sides }: ResidencePlanProps) {
  const geometry = planGeometry[residence.position];
  if (!geometry) return null;
  const pad = wallPad(geometry);
  const toPercent = (point: { x: number; y: number }) => ({
    left: `${((point.x + pad) / (geometry.width + 2 * pad)) * 100}%`,
    top: `${((point.y + pad) / (geometry.height + 2 * pad)) * 100}%`,
  });
  const entrance = toPlan(geometry, geometry.entrance);
  const entranceOnTop = entrance.y < geometry.height / 2;
  const aspect = planAspect(geometry);
  // Long end residences are drawn small on phones: their small rooms move from the drawing to a caption.
  const compact = layout.widthM > COMPACT_WIDTH_M;
  const isSmall = (room: Room) => compact && room.areaM2 < SMALL_ROOM_M2;
  const smallRooms = layout.rooms.filter(isSmall);

  return (
    <section
      aria-label={fillTemplate(t.plan.label, { number: residence.number })}
      className="flex flex-col gap-3 border-y border-border bg-card py-4 lg:gap-0 lg:rounded-base lg:border lg:p-6"
    >
      <div className="flex items-center justify-between px-4 lg:h-10 lg:px-0">
        <p className="text-overline text-muted-foreground">
          {fillTemplate(t.plan.title, { area: areaText(residence.areaM2) })}
        </p>
        <p className="flex items-center gap-1 text-caption text-muted-foreground lg:gap-2 lg:text-label lg:text-foreground">
          <ArrowRightIcon className={cn("text-foreground", geometry.north === "up" ? "-rotate-90" : "rotate-180")} />
          {t.plan.north}
        </p>
      </div>

      <div
        className={cn(
          "flex justify-center px-6 py-8 [--plan-max-h:22.5rem] lg:px-10 lg:pt-10 lg:[--plan-max-h:30rem]",
          entranceOnTop ? "lg:pb-16" : "pb-12 lg:pb-30",
        )}
      >
        <div
          className="relative"
          style={{ aspectRatio: aspect, width: `min(100%, calc(var(--plan-max-h) * ${aspect}))` }}
        >
          <ResidenceDrawing position={residence.position} className="absolute inset-0 size-full" />
          <ul aria-label={t.plan.rooms}>
            {layout.rooms.map((room, index) => {
              const label = geometry.labels[index];
              if (!label) return null;
              return (
                <li
                  key={`${room.name}-${index}`}
                  className={cn(
                    "absolute flex -translate-1/2 flex-col items-center gap-0.5 text-center lg:gap-1",
                    isSmall(room) && "max-lg:hidden",
                  )}
                  style={toPercent(toPlan(geometry, label))}
                >
                  <span
                    className={cn(
                      "text-caption text-foreground lg:max-w-none lg:text-label lg:whitespace-nowrap",
                      compact ? "max-w-16" : "max-w-24",
                    )}
                  >
                    {t.rooms[room.name]}
                  </span>
                  <span className="text-caption whitespace-nowrap text-muted-foreground">{areaText(room.areaM2)}</span>
                </li>
              );
            })}
          </ul>
          <p
            className={cn(
              "absolute flex -translate-x-1/2 items-center gap-1 text-caption text-muted-foreground",
              entranceOnTop ? "bottom-full mb-0.5 flex-col" : "top-full mt-0.5 flex-col-reverse lg:mt-16",
            )}
            style={{ left: toPercent(entrance).left }}
          >
            {t.plan.entrance}
            <ArrowRightIcon className={cn("text-foreground", entranceOnTop ? "rotate-90" : "-rotate-90")} />
          </p>
          <PlanDimensions width={layout.widthM} depth={layout.depthM} padPercent={toPercent({ x: 0, y: 0 })} />
        </div>
      </div>

      <div className="flex flex-col gap-1 px-4 text-caption text-muted-foreground lg:flex-row lg:items-center lg:justify-between lg:px-0">
        <p>{fillTemplate(t.plan.windows, { side: sides[residence.side], view: residence.view.toLowerCase() })}</p>
        {smallRooms.length > 0 && (
          <p className="lg:hidden">
            {smallRooms.map((room) => `${t.rooms[room.name]} ${areaText(room.areaM2)}`).join("  ·  ")}
          </p>
        )}
        {layout.terraceM2 !== null && (
          <p>{fillTemplate(t.plan.terrace, { area: areaText(layout.terraceM2) })}</p>
        )}
        <p className="hidden lg:block">{fillTemplate(t.plan.ceiling, { height: layout.ceilingM.toFixed(1) })}</p>
      </div>
    </section>
  );
}
