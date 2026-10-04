import { PageSkeleton } from "@/components/residences/page-skeleton";
import { getDictionary } from "@/content";

export default function ResidencesLoading() {
  return <PageSkeleton theme="dark" label={getDictionary("en").residences.loading} />;
}
