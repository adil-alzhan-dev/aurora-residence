import type { ReactNode } from "react";

import { AuthGate } from "@/components/admin/auth-gate";
import { AdminShell } from "@/components/admin/shell/admin-shell";
import { getAdminDictionary } from "@/content/en-admin";

const t = getAdminDictionary();

export default function AdminPanelLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <AuthGate checkingLabel={t.common.checkingSession}>
      <AdminShell t={t}>{children}</AdminShell>
    </AuthGate>
  );
}
