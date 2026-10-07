import { ResidenceNotFound } from "@/components/admin/residence/residence-not-found";
import { getAdminDictionary } from "@/lib/locale-server";

export default async function AdminResidenceNotFound() {
  return <ResidenceNotFound t={(await getAdminDictionary()).residence} />;
}
