import { SectionPlaceholder } from "@/components/admin/section-placeholder";
import { getAdminDictionary } from "@/content/en-admin";

const t = getAdminDictionary();

export default function AdminEnquiriesPage() {
  return <SectionPlaceholder title={t.nav.enquiries} />;
}
