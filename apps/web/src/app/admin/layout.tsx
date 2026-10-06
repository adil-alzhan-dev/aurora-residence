import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminProviders } from "@/components/admin/admin-providers";
import { getAdminDictionary } from "@/content/en-admin";

const t = getAdminDictionary();

export const metadata: Metadata = {
  title: t.meta.title,
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <AdminProviders>{children}</AdminProviders>;
}
