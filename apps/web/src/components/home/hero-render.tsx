import Image from "next/image";

import { useDeferredLayer } from "@/lib/deferred-layer";
import { cn } from "@/lib/utils";

export type TimeOfDay = "day" | "evening";

const RENDER_SIZES = "(min-width: 1024px) 100vw, 182vw";

type RenderLayerProps = {
  src: string;
  alt: string;
  visible: boolean;
  preload?: boolean;
};

function RenderLayer({ src, alt, visible, preload = false }: RenderLayerProps) {
  const mounted = useDeferredLayer(visible);
  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "absolute inset-0 transition-opacity duration-900 ease-in-out",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      {mounted && (
        <>
          <Image
            src={src}
            alt=""
            fill
            sizes={RENDER_SIZES}
            className="top-auto! bottom-full! hidden -scale-y-100 object-cover lg:block"
          />
          <Image src={src} alt={alt} fill preload={preload} sizes={RENDER_SIZES} className="object-cover" />
        </>
      )}
    </div>
  );
}

type HeroRenderProps = {
  time: TimeOfDay;
  dayAlt: string;
  eveningAlt: string;
};

export function HeroRender({ time, dayAlt, eveningAlt }: HeroRenderProps) {
  return (
    <div className="relative aspect-[3/2] w-full animate-hero-render">
      <RenderLayer src="/images/facade-day.jpg" alt={dayAlt} visible={time === "day"} preload />
      <RenderLayer src="/images/facade-dusk.jpg" alt={eveningAlt} visible={time === "evening"} />
    </div>
  );
}
