import type { Metadata } from "next";
import { Suspense } from "react";

import { EnquiriesView } from "@/components/admin/enquiries/enquiries-view";
import { getAdminDictionary } from "@/lib/locale-server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAdminDictionary()).meta.enquiriesTitle };
}

export default async function AdminEnquiriesPage() {
  const t = await getAdminDictionary();
  return (
    <Suspense>
      <EnquiriesView t={t} />
    </Suspense>
  );
}
