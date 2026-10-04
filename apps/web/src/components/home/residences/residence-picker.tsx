import { RevealSection } from "@/components/motion/reveal-section";
import type { Dictionary } from "@/content";
import type { SectionId } from "@/content/navigation";
import type { FloorSummary } from "@/lib/api/floors";
import { revealDelay } from "@/lib/motion";

import { FacadeExplorer } from "./facade-explorer";
import { ViewLinks } from "@/components/residences/view-links";

type ResidencePickerProps = {
  floors: FloorSummary[] | null;
  t: Pick<Dictionary, "residencePicker" | "status">;
};

export function ResidencePicker({ floors, t }: ResidencePickerProps) {
  const picker = t.residencePicker;
  return (
    <RevealSection
      id={"residences" satisfies SectionId}
      data-theme="dark"
      aria-labelledby="residences-title"
      threshold={0.1}
      className="bg-background py-16 lg:py-32"
    >
      <div className="container-page flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div data-reveal="up" className="flex max-w-[624px] flex-col gap-4 lg:gap-6">
          <p className="text-overline text-primary">{picker.overline}</p>
          <h2 id="residences-title" className="text-h2 text-foreground lg:text-h1">
            {picker.title}
          </h2>
          <p className="text-body text-muted-foreground lg:hidden">{picker.leadTouch}</p>
          <p className="hidden text-body-l text-muted-foreground lg:block">{picker.lead}</p>
        </div>
        <div data-reveal="up" style={revealDelay(120)}>
          <ViewLinks t={picker} current="facade" />
        </div>
      </div>
      <div className="mt-8 lg:mt-16">
        <FacadeExplorer floors={floors} t={t} />
      </div>
    </RevealSection>
  );
}
