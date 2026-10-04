import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RevealSection } from "@/components/motion/reveal-section";
import { FloorExplorer } from "@/components/residences/floor/floor-explorer";
import { FloorHeading } from "@/components/residences/floor/floor-heading";
import { getDictionary } from "@/content";
import { getFloorDetails, getFloorSummaries } from "@/lib/api/floors";
import { fillTemplate } from "@/lib/format";

const t = getDictionary("en");

// Only plain floor numbers: "7" is a floor, "07", "7.0" or "12" are not.
const FLOOR_PARAM = /^(?:[1-9]|1[01])$/;

function parseFloor(param: string) {
  if (!FLOOR_PARAM.test(param)) notFound();
  return Number(param);
}

export async function generateMetadata({ params }: PageProps<"/residences/floor/[floor]">): Promise<Metadata> {
  const floor = parseFloor((await params).floor);
  return { title: fillTemplate(t.floorPage.metaTitle, { floor }) };
}

export default async function FloorPage({ params }: PageProps<"/residences/floor/[floor]">) {
  const floor = parseFloor((await params).floor);
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
