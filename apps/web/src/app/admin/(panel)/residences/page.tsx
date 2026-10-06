import { Suspense } from "react";

import { ResidencesView } from "@/components/admin/residences/residences-view";
import { getAdminDictionary } from "@/content/en-admin";

const t = getAdminDictionary();

export default function AdminResidencesPage() {
  return (
    <Suspense>
      <ResidencesView t={t} />
    </Suspense>
  );
}
