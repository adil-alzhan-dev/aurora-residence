import type { ReactNode } from "react";

import { AuthGate } from "@/components/admin/auth-gate";
import { getAdminDictionary } from "@/content/en-admin";

const t = getAdminDictionary();

export default function AdminPanelLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <AuthGate checkingLabel={t.common.checkingSession}>{children}</AuthGate>;
}
