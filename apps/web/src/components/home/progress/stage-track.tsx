import { revealDelay } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type StageState = "done" | "current" | "planned";

const FILL_STEP_MS = 350;

type StageTrackProps = {
  state: StageState;
  isLast: boolean;
  percent: number;
  index: number;
};

function StageDot({ state }: { state: StageState }) {
  if (state === "current") {
    return (
      <span className="relative flex size-4 shrink-0 items-center justify-center">
        <span className="absolute inset-0 animate-halo rounded-full bg-primary" />
        <span className="relative size-4 rounded-full border-4 border-background bg-primary" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "size-2.5 shrink-0 rounded-full",
        state === "done" ? "bg-primary lg:bg-foreground" : "bg-border lg:border lg:border-muted-foreground lg:bg-transparent",
      )}
    />
  );
}

export function StageTrack({ state, isLast, percent, index }: StageTrackProps) {
  const fill = revealDelay(index * FILL_STEP_MS);
  return (
    <div aria-hidden="true" className="flex w-4 shrink-0 flex-col items-center lg:h-6 lg:w-full lg:flex-row lg:gap-3">
      <StageDot state={state} />
      {!isLast && (
        <span
          data-reveal="line-y"
          style={fill}
          className={cn("w-px flex-1 lg:hidden", state === "done" ? "bg-primary" : "bg-border")}
        />
      )}
      <span className="hidden h-px flex-1 bg-border lg:flex">
        {state !== "planned" && (
          <span
            data-reveal="line-x"
            style={{ ...fill, width: state === "done" ? "100%" : `${percent}%` }}
            className={cn("h-px", state === "done" ? "bg-foreground" : "bg-primary")}
          />
        )}
      </span>
    </div>
  );
}
