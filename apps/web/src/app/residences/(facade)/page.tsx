import type { Metadata } from "next";

import { RevealSection } from "@/components/motion/reveal-section";
import { FacadeBrowser } from "@/components/residences/facade/facade-browser";
import { ResidenceViews } from "@/components/residences/residence-views";
import { ResidencesIntro } from "@/components/residences/residences-intro";
import { getDictionary } from "@/content";
import type { ResidenceView } from "@/content/navigation";
import { loadFacadeData } from "@/lib/facade-data";
import { parseResidenceFilters } from "@/lib/residence-filters";
import { parseResidenceSort, sortParam } from "@/lib/residence-sort";
import { loadResidencesData } from "@/lib/residences-data";

const t = getDictionary("en");

export const metadata: Metadata = { title: t.residences.metaTitle };

const parseView = (value: unknown): ResidenceView => (value === "grid" || value === "list" ? value : "facade");

export default async function ResidencesPage({ searchParams }: PageProps<"/residences">) {
  const params = await searchParams;
  const view = parseView(params.view);
  const filters = parseResidenceFilters(params);
  const sort = parseResidenceSort(params.sort);
  const keep = { view: view === "facade" ? null : view, sort: sortParam(sort) };

  const facade = view === "facade" ? await loadFacadeData(filters) : null;
  const views = view === "facade" ? null : await loadResidencesData(filters, sort);
  const source = facade ?? views;

  return (
    <RevealSection
      data-theme={facade ? "dark" : "light"}
      aria-labelledby="residences-title"
      threshold={0}
      className="bg-background pt-(--header-height)"
    >
      <ResidencesIntro
        view={view}
        filters={filters}
        sort={sort}
        keep={keep}
        result={source?.result ?? null}
        priceRange={source?.priceRange ?? null}
        t={t}
      />
      {facade && (
        <>
          {!facade.summaries && (
            <p role="status" className="container-page py-4 text-body text-muted-foreground">
              {t.residences.unavailable}
            </p>
          )}
          <FacadeBrowser
            summaries={facade.summaries}
            cells={facade.cells}
            initialFloor={facade.initialFloor}
            noMatches={facade.result?.matching === 0}
            t={t}
          />
        </>
      )}
      {views && view !== "facade" && (
        <ResidenceViews view={view} data={views} filters={filters} sort={sort} keep={keep} t={t} />
      )}
    </RevealSection>
  );
}
