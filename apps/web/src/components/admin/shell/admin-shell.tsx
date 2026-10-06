import type { ReactNode } from "react";

import type { AdminDictionary } from "@/content/en-admin";

import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";

export function AdminShell({ t, children }: { t: AdminDictionary; children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-background lg:flex-row">
      <AdminSidebar t={t} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar t={t} />
        <main id="main" className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
