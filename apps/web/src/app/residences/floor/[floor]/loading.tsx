import { PageSkeleton } from "@/components/residences/page-skeleton";
import { getDictionary } from "@/content";

export default function FloorLoading() {
  return <PageSkeleton theme="light" label={getDictionary("en").floorPage.loading} />;
}
