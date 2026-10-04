import { RevealSection } from "@/components/motion/reveal-section";
import type { Dictionary } from "@/content";
import type { SectionId } from "@/content/navigation";
import { fillTemplate } from "@/lib/format";
import { revealDelay } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { StageTrack, type StageState } from "./stage-track";

const STAGE_STAGGER_MS = 120;

type ConstructionProgressProps = {
  t: Pick<Dictionary, "progress">;
};

export function ConstructionProgress({ t }: ConstructionProgressProps) {
  const { progress } = t;
  const stateOf = (index: number): StageState =>
    index < progress.currentStage ? "done" : index === progress.currentStage ? "current" : "planned";
  const statusOf = (state: StageState) =>
    state === "done"
      ? progress.completed
      : state === "current"
        ? fillTemplate(progress.inProgress, { percent: progress.currentPercent })
        : progress.planned;

  return (
    <RevealSection
      id={"progress" satisfies SectionId}
      aria-labelledby="progress-title"
      className="bg-background py-16 lg:py-32"
    >
      <div className="container-page flex flex-col gap-8 lg:gap-16">
        <div data-reveal="up" className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <div className="flex max-w-[624px] flex-col gap-4 lg:gap-6">
            <p className="text-overline text-primary">{progress.overline}</p>
            <h2 id="progress-title" className="text-h2 text-foreground">
              {progress.title}
            </h2>
          </div>
          <p className="text-body text-muted-foreground lg:w-[406px] lg:shrink-0">{progress.lead}</p>
        </div>

        <ol className="flex flex-col lg:grid lg:grid-cols-4 lg:gap-8">
          {progress.stages.map((stage, index) => {
            const state = stateOf(index);
            const isLast = index === progress.stages.length - 1;
            return (
              <li key={stage.number} className="flex gap-4 lg:flex-col lg:gap-6">
                <StageTrack state={state} isLast={isLast} percent={progress.currentPercent} index={index} />
                <div
                  data-reveal="up"
                  style={revealDelay(300 + index * STAGE_STAGGER_MS)}
                  className={cn("flex flex-1 flex-col gap-2 lg:gap-6 lg:pb-0", !isLast && "pb-8")}
                >
                  <div className="flex flex-col gap-2">
                    <p
                      className={cn(
                        "text-overline whitespace-pre-wrap",
                        state === "planned" ? "text-muted-foreground" : "text-primary",
                        state === "done" && "lg:text-muted-foreground",
                      )}
                    >
                      {fillTemplate(progress.stageMeta, { number: stage.number, period: stage.period })}
                    </p>
                    <h3 className={cn("text-h3", state === "planned" ? "text-muted-foreground" : "text-foreground")}>
                      {stage.title}
                    </h3>
                    <p className="text-body text-muted-foreground">{stage.text}</p>
                    {state === "current" && (
                      <div aria-hidden="true" className="flex h-0.5 lg:hidden">
                        <span className="bg-primary" style={{ width: `${progress.currentPercent}%` }} />
                        <span className="flex-1 bg-border" />
                      </div>
                    )}
                  </div>
                  <p className={cn("text-caption", state === "current" ? "text-primary" : "text-muted-foreground")}>
                    {statusOf(state)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </RevealSection>
  );
}
