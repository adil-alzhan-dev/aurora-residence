import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RevealSection } from "@/components/motion/reveal-section";
import { EnquiryProvider } from "@/components/residence/enquiry/enquiry-context";
import { FloorPosition } from "@/components/residence/floor-position";
import { InstalmentCalculator } from "@/components/residence/instalment-calculator";
import { ResidencePlan } from "@/components/residence/plan/residence-plan";
import { ResidenceBreadcrumbs } from "@/components/residence/residence-breadcrumbs";
import { ResidencePrice, ResidenceRequest, ResidenceSpecs, ResidenceTitle } from "@/components/residence/residence-summary";
import { SimilarResidences } from "@/components/residence/similar-residences";
import { SoldAlternatives } from "@/components/residence/sold-alternatives";
import { StickyRequestBar } from "@/components/residence/sticky-request-bar";
import { facesPark, WindowView } from "@/components/residence/window-view";
import { getDictionary } from "@/content";
import { getResidence } from "@/lib/api/residences";
import { parseResidenceParam } from "@/lib/building";
import { fillTemplate, formatArea } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { getMoneySettings } from "@/lib/money-server";
import { loadResidencePage } from "@/lib/residence-page-data";
import { layoutOf } from "@/lib/residence-layouts";
import { revealDelay } from "@/lib/motion";

const t = getDictionary("en");

export async function generateMetadata({ params }: PageProps<"/residences/[number]">): Promise<Metadata> {
  const { number } = parseResidenceParam((await params).number);
  const [residence, money] = await Promise.all([getResidence(number), getMoneySettings()]);
  const text = t.residencePage;
  if (!residence) return { title: fillTemplate(text.metaTitleShort, { number }) };

  const values = {
    number,
    floor: residence.floor,
    type: t.floorPage.typeNames[residence.bedrooms] ?? "",
    area: `${formatArea(residence.areaM2)} m²`,
    view: residence.view.toLowerCase(),
    price: formatMoney(residence.priceUsd, money),
  };
  const description = residence.status === "sold" ? text.metaDescriptionSold : text.metaDescription;
  return { title: fillTemplate(text.metaTitle, values), description: fillTemplate(description, values) };
}

export default async function ResidencePage({ params }: PageProps<"/residences/[number]">) {
  const { number, floor } = parseResidenceParam((await params).number);
  const data = await loadResidencePage(number);
  const text = t.residencePage;

  if (!data) {
    return (
      <section data-theme="light" className="bg-background pt-(--header-height)">
        <ResidenceBreadcrumbs number={number} floor={floor} t={text} />
        <p role="alert" className="container-page py-12 text-body-l text-muted-foreground lg:pt-0 lg:pb-32">
          {text.unavailable}
        </p>
      </section>
    );
  }

  const { residence, floorResidences, similar } = data;
  const layout = layoutOf(residence.position, residence.isPenthouse);
  if (!layout) notFound();
  const sold = residence.status === "sold";
  // The same tree for every status, so a live refresh never remounts the page or drops an open form.
  return (
    <EnquiryProvider residence={residence} t={t}>
      <RevealSection data-theme="light" threshold={0} className="bg-background pt-(--header-height)">
        <ResidenceBreadcrumbs number={number} floor={floor} t={text} />
        <div className="flex flex-col pb-12 lg:container-page lg:grid lg:grid-cols-[minmax(0,760fr)_minmax(0,456fr)] lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:gap-y-8 lg:pb-32">
          <div data-reveal="up" className="px-(--page-gutter) pt-4 pb-6 lg:col-start-2 lg:row-start-1 lg:p-0">
            <ResidenceTitle residence={residence} t={t} />
          </div>
          <div data-reveal="up" className="lg:col-start-1 lg:row-span-2 lg:row-start-1">
            <ResidencePlan residence={residence} layout={layout} t={t} />
          </div>
          <div
            data-reveal="up"
            style={revealDelay(120)}
            className="flex flex-col gap-6 px-(--page-gutter) pt-6 lg:col-start-2 lg:row-start-2 lg:gap-8 lg:p-0"
          >
            <ResidenceSpecs residence={residence} ceilingM={layout.ceilingM} t={t} />
            <ResidencePrice residence={residence} t={t} />
            {sold ? (
              <SoldAlternatives floor={floor} floorResidences={floorResidences} similar={similar} t={t} />
            ) : (
              <ResidenceRequest residence={residence} t={t} />
            )}
            <FloorPosition residence={residence} t={text.position} />
          </div>
        </div>
      </RevealSection>
      <div className="bg-background">
        {facesPark(residence) && <WindowView residence={residence} t={text.windowView} />}
        {!sold && <InstalmentCalculator priceUsd={residence.priceUsd} t={text} />}
        <SimilarResidences residences={similar} t={t} />
      </div>
      {!sold && <StickyRequestBar residence={residence} t={text} />}
    </EnquiryProvider>
  );
}
