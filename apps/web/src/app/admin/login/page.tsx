import type { Metadata } from "next";

import { LoginScreen } from "@/components/admin/login/login-screen";
import { getAdminDictionary } from "@/lib/locale-server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAdminDictionary()).meta.loginTitle };
}

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  const [{ next }, t] = await Promise.all([searchParams, getAdminDictionary()]);
  return <LoginScreen t={t} next={typeof next === "string" ? next : null} />;
}
