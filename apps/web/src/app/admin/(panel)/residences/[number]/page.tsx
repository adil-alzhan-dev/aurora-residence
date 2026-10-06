import type { Metadata } from "next";

import { ResidenceCardView } from "@/components/admin/residence/residence-card-view";
import { getAdminDictionary } from "@/content/en-admin";
import { parseResidenceParam } from "@/lib/building";
import { fillTemplate } from "@/lib/format";

const t = getAdminDictionary();

export async function generateMetadata({ params }: PageProps<"/admin/residences/[number]">): Promise<Metadata> {
  const { number } = parseResidenceParam((await params).number);
  return { title: fillTemplate(t.meta.residenceTitle, { number }) };
}

/**
 * Every number of the 1.01-11.06 pattern exists, anything else shows "Residence not found".
 * The panel streams behind the session check, so this is a soft 404 (200 with noindex).
 */
export default async function AdminResidencePage({ params }: PageProps<"/admin/residences/[number]">) {
  const { number } = parseResidenceParam((await params).number);
  return <ResidenceCardView number={number} t={t} />;
}
