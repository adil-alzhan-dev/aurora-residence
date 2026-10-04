import Image from "next/image";

import { cn } from "@/lib/utils";

export type TimeOfDay = "day" | "evening";

const sources: Record<TimeOfDay, string> = {
  day: "/images/facade-day.jpg",
  evening: "/images/facade-dusk.jpg",
};

type FacadeRenderProps = {
  time: TimeOfDay;
  alt: string;
  sizes: string;
  /** Pass to stack the daylight render under the evening one for the Day / Evening switch. */
  dayAlt?: string;
};

/** Both renders share the same geometry to the pixel, so the overlay never moves when they crossfade. */
export function FacadeRender({ time, alt, sizes, dayAlt }: FacadeRenderProps) {
  const layers: { time: TimeOfDay; alt: string }[] = dayAlt
    ? [
        { time: "day", alt: dayAlt },
        { time: "evening", alt },
      ]
    : [{ time: "evening", alt }];

  return layers.map((layer) => {
    const visible = layer.time === time || layers.length === 1;
    return (
      <Image
        key={layer.time}
        src={sources[layer.time]}
        alt={visible ? layer.alt : ""}
        aria-hidden={!visible}
        fill
        sizes={sizes}
        className={cn(
          "object-cover transition-opacity duration-900 ease-in-out",
          visible ? "opacity-100" : "opacity-0",
        )}
      />
    );
  });
}
