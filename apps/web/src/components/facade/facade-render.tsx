import Image from "next/image";

import { useDeferredLayer } from "@/lib/deferred-layer";
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
  /** The render is the first screen of the page. */
  preload?: boolean;
  /** Below the fold and hidden until its reveal: wait for the page to load like a hidden layer. */
  afterLoad?: boolean;
};

type FacadeLayerProps = {
  time: TimeOfDay;
  alt: string;
  sizes: string;
  visible: boolean;
  preload: boolean;
  afterLoad: boolean;
};

function FacadeLayer({ time, alt, sizes, visible, preload, afterLoad }: FacadeLayerProps) {
  if (!useDeferredLayer(visible && !afterLoad)) return null;
  return (
    <Image
      src={sources[time]}
      alt={visible ? alt : ""}
      aria-hidden={!visible}
      fill
      preload={preload && visible}
      sizes={sizes}
      className={cn(
        "object-cover transition-opacity duration-900 ease-in-out",
        visible ? "opacity-100" : "opacity-0",
      )}
    />
  );
}

/** Both renders share the same geometry to the pixel, so the overlay never moves when they crossfade. */
export function FacadeRender({ time, alt, sizes, dayAlt, preload = false, afterLoad = false }: FacadeRenderProps) {
  const layers: { time: TimeOfDay; alt: string }[] = dayAlt
    ? [
        { time: "day", alt: dayAlt },
        { time: "evening", alt },
      ]
    : [{ time: "evening", alt }];

  return layers.map((layer) => (
    <FacadeLayer
      key={layer.time}
      time={layer.time}
      alt={layer.alt}
      sizes={sizes}
      visible={layer.time === time || layers.length === 1}
      preload={preload}
      afterLoad={afterLoad}
    />
  ));
}
