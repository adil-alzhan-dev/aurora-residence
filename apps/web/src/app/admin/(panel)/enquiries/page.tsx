import type { Metadata } from "next";
import { Suspense } from "react";

import { EnquiriesView } from "@/components/admin/enquiries/enquiries-view";
import { getAdminDictionary } from "@/content/en-admin";

const t = getAdminDictionary();

export const metadata: Metadata = { title: t.meta.enquiriesTitle };

export default function AdminEnquiriesPage() {
  return (
    <Suspense>
      <EnquiriesView t={t} />
    </Suspense>
  );
}
