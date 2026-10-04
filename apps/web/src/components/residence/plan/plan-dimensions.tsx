type PlanDimensionsProps = {
  width: number;
  depth: number;
  /** Distance from the drawing edge to the outer face of the walls, as CSS percentages. */
  padPercent: { left: string; top: string };
};

const tick = "absolute bg-muted-foreground";

/** Dimension lines under and to the left of the walls, as in the Figma plan. Desktop only. */
export function PlanDimensions({ width, depth, padPercent }: PlanDimensionsProps) {
  return (
    <div aria-hidden="true" className="hidden text-caption text-muted-foreground lg:block">
      <div
        className="absolute top-[calc(100%+0.75rem)] h-5"
        style={{ left: padPercent.left, right: padPercent.left }}
      >
        <span className={`${tick} inset-x-0 top-2.5 h-px`} />
        <span className={`${tick} top-1 left-0 h-[13px] w-px`} />
        <span className={`${tick} top-1 right-0 h-[13px] w-px`} />
        <span className="absolute top-5 left-1/2 -translate-x-1/2 whitespace-nowrap">{width.toFixed(1)} m</span>
      </div>
      <div
        className="absolute right-[calc(100%+0.5rem)] w-5"
        style={{ top: padPercent.top, bottom: padPercent.top }}
      >
        <span className={`${tick} inset-y-0 left-2.5 w-px`} />
        <span className={`${tick} top-0 left-1 h-px w-[13px]`} />
        <span className={`${tick} bottom-0 left-1 h-px w-[13px]`} />
        <span className="absolute top-1/2 right-3.5 -translate-y-1/2 -rotate-90 whitespace-nowrap">
          {depth.toFixed(1)} m
        </span>
      </div>
    </div>
  );
}
