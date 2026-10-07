import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminProviders } from "@/components/admin/admin-providers";
import { getAdminDictionary } from "@/lib/locale-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminDictionary();
  return {
    title: t.meta.title,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  const t = await getAdminDictionary();
  return <AdminProviders intl={t.locale.intl}>{children}</AdminProviders>;
}
