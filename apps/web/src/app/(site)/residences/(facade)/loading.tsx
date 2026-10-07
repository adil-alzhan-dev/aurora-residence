import { Suspense } from "react";

import { PageSkeleton } from "@/components/residences/page-skeleton";
import { ViewSkeleton } from "@/components/residences/view-skeleton";
import { getSiteDictionary } from "@/lib/locale-server";

export default async function ResidencesLoading() {
  const label = (await getSiteDictionary()).residences.loading;
  return (
    <Suspense fallback={<PageSkeleton theme="dark" label={label} />}>
      <ViewSkeleton label={label} />
    </Suspense>
  );
}
