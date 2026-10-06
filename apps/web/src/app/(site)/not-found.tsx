import type { Metadata } from "next";

import { NotFoundContent, notFoundTitle } from "@/components/layout/not-found-content";

export const metadata: Metadata = { title: notFoundTitle };

export default function SiteNotFound() {
  return <NotFoundContent />;
}
