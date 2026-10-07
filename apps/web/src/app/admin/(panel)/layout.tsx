import type { ReactNode } from "react";

import { AuthGate } from "@/components/admin/auth-gate";
import { AdminShell } from "@/components/admin/shell/admin-shell";
import { getAdminDictionary } from "@/lib/locale-server";

export default async function AdminPanelLayout({ children }: Readonly<{ children: ReactNode }>) {
  const t = await getAdminDictionary();
  return (
    <AuthGate checkingLabel={t.common.checkingSession}>
      <AdminShell t={t}>{children}</AdminShell>
    </AuthGate>
  );
}
