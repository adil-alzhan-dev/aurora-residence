"use client";

import { createContext, useContext, type ReactNode } from "react";

import { adminFormat, type AdminFormat } from "@/lib/admin/admin-format";

const AdminFormatContext = createContext<AdminFormat>(adminFormat("en-US"));

/** Numbers and dates of the admin in the language the server rendered it in. */
export function AdminLocaleProvider({ intl, children }: { intl: string; children: ReactNode }) {
  return <AdminFormatContext value={adminFormat(intl)}>{children}</AdminFormatContext>;
}

export const useAdminFormat = () => useContext(AdminFormatContext);
