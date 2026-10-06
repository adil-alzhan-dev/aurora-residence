import { getAdminDictionary } from "@/content/en-admin";

const t = getAdminDictionary();

export default function AdminDashboardPage() {
  return <h1 className="text-admin-title">{t.dashboard.title}</h1>;
}
