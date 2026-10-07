import { PageSkeleton } from "@/components/residences/page-skeleton";
import { getSiteDictionary } from "@/lib/locale-server";

export default async function FloorLoading() {
  return <PageSkeleton theme="light" label={(await getSiteDictionary()).floorPage.loading} />;
}
