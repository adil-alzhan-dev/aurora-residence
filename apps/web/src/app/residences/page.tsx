import type { Metadata } from "next";

import { RevealSection } from "@/components/motion/reveal-section";
import { FacadeBrowser } from "@/components/residences/facade/facade-browser";
import { ResidencesIntro } from "@/components/residences/residences-intro";
import { ViewComingSoon } from "@/components/residences/view-coming-soon";
import { getDictionary } from "@/content";
import { loadFacadeData } from "@/lib/facade-data";
import { parseResidenceFilters } from "@/lib/residence-filters";

const t = getDictionary("en");

export const metadata: Metadata = { title: t.residences.metaTitle };

export default async function ResidencesPage({ searchParams }: PageProps<"/residences">) {
  const params = await searchParams;
  const view = params.view === "grid" || params.view === "list" ? params.view : "facade";
  const filters = parseResidenceFilters(params);
  const data = await loadFacadeData(filters);

  return (
    <RevealSection
      data-theme="dark"
      aria-labelledby="residences-title"
      threshold={0}
      className="bg-background pt-(--header-height)"
    >
      <ResidencesIntro view={view} filters={filters} result={data.result} priceRange={data.priceRange} t={t} />
      {!data.summaries && (
        <p role="status" className="container-page py-4 text-body text-muted-foreground">
          {t.residences.unavailable}
        </p>
      )}
      {view === "facade" ? (
        <FacadeBrowser
          summaries={data.summaries}
          cells={data.cells}
          initialFloor={data.initialFloor}
          noMatches={data.result?.matching === 0}
          t={t}
        />
      ) : (
        <ViewComingSoon view={view} t={t.residences.comingSoon} />
      )}
    </RevealSection>
  );
}
