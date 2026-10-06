import type { Metadata } from "next";

import { EnquiryCardView } from "@/components/admin/enquiry/enquiry-card-view";
import { getAdminDictionary } from "@/content/en-admin";

const t = getAdminDictionary();

export const metadata: Metadata = { title: t.meta.enquiryTitle };

const ENQUIRY_ID = /^[1-9]\d{0,8}$/;

/** A malformed id shows "Enquiry not found" without asking the API. */
export default async function AdminEnquiryPage({ params }: PageProps<"/admin/enquiries/[id]">) {
  const { id } = await params;
  return <EnquiryCardView id={ENQUIRY_ID.test(id) ? Number(id) : null} t={t} />;
}
