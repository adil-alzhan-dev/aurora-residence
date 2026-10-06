import { parseFloorParam } from "@/lib/building";

/**
 * Checked here, above the loading state of the page: once the page starts streaming,
 * notFound() can no longer change the status code, and a wrong floor must answer 404.
 */
export default async function FloorLayout({ children, params }: LayoutProps<"/residences/floor/[floor]">) {
  parseFloorParam((await params).floor);
  return children;
}
