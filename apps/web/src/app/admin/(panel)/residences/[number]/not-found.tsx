import { ResidenceNotFound } from "@/components/admin/residence/residence-not-found";
import { getAdminDictionary } from "@/content/en-admin";

const t = getAdminDictionary();

export default function AdminResidenceNotFound() {
  return <ResidenceNotFound t={t.residence} />;
}
