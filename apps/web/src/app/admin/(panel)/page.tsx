import { DashboardView } from "@/components/admin/dashboard/dashboard-view";
import { getAdminDictionary } from "@/content/en-admin";

const t = getAdminDictionary();

export default function AdminDashboardPage() {
  return <DashboardView t={t} />;
}
