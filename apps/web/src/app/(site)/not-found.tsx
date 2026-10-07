import { generateNotFoundMetadata, NotFoundContent } from "@/components/layout/not-found-content";

export const generateMetadata = generateNotFoundMetadata;

export default function SiteNotFound() {
  return <NotFoundContent />;
}
