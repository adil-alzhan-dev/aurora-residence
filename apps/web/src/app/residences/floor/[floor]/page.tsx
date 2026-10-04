import type { Metadata } from "next";

import { RevealSection } from "@/components/motion/reveal-section";
import { FloorExplorer } from "@/components/residences/floor/floor-explorer";
import { FloorHeading } from "@/components/residences/floor/floor-heading";
import { getDictionary } from "@/content";
import { getFloorDetails, getFloorSummaries } from "@/lib/api/floors";
import { parseFloorParam } from "@/lib/building";
import { fillTemplate } from "@/lib/format";

const t = getDictionary("en");

export async function generateMetadata({ params }: PageProps<"/residences/floor/[floor]">): Promise<Metadata> {
  const floor = parseFloorParam((await params).floor);
  return { title: fillTemplate(t.floorPage.metaTitle, { floor }) };
}

export default async function FloorPage({ params }: PageProps<"/residences/floor/[floor]">) {
  const floor = parseFloorParam((await params).floor);
  const [details, summaries] = await Promise.all([getFloorDetails(floor), getFloorSummaries()]);
  const neighbours = [floor + 1, floor - 1].flatMap(
    (number) => summaries?.find((summary) => summary.floor === number) ?? [],
  );

  return (
    <RevealSection data-theme="light" threshold={0} className="bg-background pt-(--header-height)">
      <FloorHeading floor={floor} summary={details} neighbours={neighbours} t={t.floorPage} />
      {details ? (
        <FloorExplorer details={details} t={t} />
      ) : (
        <p role="alert" className="container-page pb-24 text-body-l text-muted-foreground">
          {t.floorPage.unavailable}
        </p>
      )}
    </RevealSection>
  );
}
