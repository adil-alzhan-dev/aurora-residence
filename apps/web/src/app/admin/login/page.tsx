import type { Metadata } from "next";

import { LoginScreen } from "@/components/admin/login/login-screen";
import { getAdminDictionary } from "@/content/en-admin";

const t = getAdminDictionary();

export const metadata: Metadata = { title: t.meta.loginTitle };

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { next } = await searchParams;
  return <LoginScreen t={t} next={typeof next === "string" ? next : null} />;
}
