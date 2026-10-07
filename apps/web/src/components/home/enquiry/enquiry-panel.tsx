"use client";

import Link from "next/link";
import { useState } from "react";

import { EnquirySuccess } from "@/components/enquiry/enquiry-success";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/content";
import { residencesHref } from "@/content/navigation";

import { EnquiryForm } from "./enquiry-form";

type EnquiryPanelProps = {
  t: Pick<Dictionary, "enquiry" | "enquirySend" | "contacts" | "locale">;
};

export function EnquiryPanel({ t }: EnquiryPanelProps) {
  const [sent, setSent] = useState(false);
  const success = t.enquirySend.success;

  if (!sent) return <EnquiryForm t={t} onSent={() => setSent(true)} />;

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <p className="text-overline text-primary">{success.overline}</p>
      <EnquirySuccess
        t={success}
        phone={t.contacts.phone}
        lead={success.lead}
        steps={[success.stepCall, success.stepChoose]}
        titleClassName="text-h3"
        action={
          <Button asChild className="w-full">
            <Link href={residencesHref}>{success.chooseResidence}</Link>
          </Button>
        }
      />
    </div>
  );
}
