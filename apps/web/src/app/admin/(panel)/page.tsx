import { DashboardView } from "@/components/admin/dashboard/dashboard-view";
import { getAdminDictionary } from "@/lib/locale-server";

export default async function AdminDashboardPage() {
  return <DashboardView t={await getAdminDictionary()} />;
}
