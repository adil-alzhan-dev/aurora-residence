import { PageSkeleton } from "@/components/residences/page-skeleton";
import { getDictionary } from "@/content";

export default function ResidenceLoading() {
  return <PageSkeleton theme="light" label={getDictionary("en").residencePage.loading} />;
}
