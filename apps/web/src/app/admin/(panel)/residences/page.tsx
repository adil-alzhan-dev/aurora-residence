import { Suspense } from "react";

import { ResidencesView } from "@/components/admin/residences/residences-view";
import { getAdminDictionary } from "@/lib/locale-server";

export default async function AdminResidencesPage() {
  const t = await getAdminDictionary();
  return (
    <Suspense>
      <ResidencesView t={t} />
    </Suspense>
  );
}
