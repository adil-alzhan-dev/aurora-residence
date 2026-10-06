import { SectionPlaceholder } from "@/components/admin/section-placeholder";
import { getAdminDictionary } from "@/content/en-admin";

const t = getAdminDictionary();

export default function AdminResidencesPage() {
  return <SectionPlaceholder title={t.nav.residences} />;
}
