import { Suspense } from "react";

import { PageSkeleton } from "@/components/residences/page-skeleton";
import { ViewSkeleton } from "@/components/residences/view-skeleton";
import { getDictionary } from "@/content";

export default function ResidencesLoading() {
  const label = getDictionary("en").residences.loading;
  return (
    <Suspense fallback={<PageSkeleton theme="dark" label={label} />}>
      <ViewSkeleton label={label} />
    </Suspense>
  );
}
