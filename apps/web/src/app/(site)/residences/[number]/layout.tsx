import { parseResidenceParam } from "@/lib/building";

/**
 * Checked here, above the loading state of the page: once the page starts streaming,
 * notFound() can no longer change the status code, and a wrong number must answer 404.
 */
export default async function ResidenceLayout({ children, params }: LayoutProps<"/residences/[number]">) {
  parseResidenceParam((await params).number);
  return children;
}
