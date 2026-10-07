"use client";

import { useState } from "react";

import { DashboardError } from "@/components/admin/dashboard/dashboard-states";
import type { AdminDictionary } from "@/content/en-admin";
import { AdminApiError } from "@/lib/admin/api-client";
import { useEnquiryCard } from "@/lib/admin/enquiry-queries";

import { EnquiryActivity } from "./enquiry-activity";
import { EnquiryClient, EnquiryComment } from "./enquiry-client";
import { BackToEnquiries, EnquiryHeading } from "./enquiry-heading";
import { EnquiryReserve } from "./enquiry-reserve";
import { EnquiryResidenceCard } from "./enquiry-residence-card";
import { EnquiryStatusCard } from "./enquiry-status-card";
import { LinkResidenceForm } from "./link-residence-form";
import { ManagerNoteCard } from "./manager-note-card";

function CardSkeleton({ label }: { label: string }) {
  const block = "rounded-base border border-border bg-card";
  return (
    <div role="status" aria-live="polite" className="flex animate-pulse flex-col gap-6 xl:flex-row">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="flex flex-1 flex-col gap-6">
        <div className={`${block} h-46`} />
        <div className={`${block} h-32`} />
        <div className={`${block} h-70`} />
      </div>
      <div aria-hidden="true" className="flex flex-col gap-6 xl:w-100">
        <div className={`${block} h-47`} />
        <div className={`${block} h-120`} />
      </div>
    </div>
  );
}

function EnquiryNotFound({ t }: { t: AdminDictionary["enquiry"] }) {
  return (
    <>
      <BackToEnquiries label={t.back} />
      <section className="flex flex-col gap-2 rounded-base border border-border bg-card p-6">
        <h1 className="text-admin-title text-foreground">{t.notFound.title}</h1>
        <p className="text-admin-body text-muted-foreground">{t.notFound.text}</p>
      </section>
    </>
  );
}

export function EnquiryCardView({ id, t }: { id: number | null; t: AdminDictionary }) {
  const { data: enquiry, error, refetch } = useEnquiryCard(id ?? 0);
  const [now] = useState(() => new Date());

  if (id === null || (error instanceof AdminApiError && (error.status === 404 || error.status === 400))) {
    return <EnquiryNotFound t={t.enquiry} />;
  }
  if (!enquiry) {
    return (
      <>
        <BackToEnquiries label={t.enquiry.back} />
        {error ? <DashboardError t={t.states} onRetry={() => void refetch()} /> : <CardSkeleton label={t.states.loading} />}
      </>
    );
  }

  return (
    <>
      <BackToEnquiries label={t.enquiry.back} />
      <EnquiryHeading enquiry={enquiry} now={now} t={t} />
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <EnquiryClient enquiry={enquiry} t={t.enquiry} sources={t.messages} />
          <EnquiryComment comment={enquiry.comment} t={t.enquiry} />
          <ManagerNoteCard enquiry={enquiry} now={now} t={t.enquiry} />
          <EnquiryActivity activity={enquiry.activity} now={now} t={t} />
        </div>
        <div className="flex flex-col gap-6 xl:w-100 xl:shrink-0">
          <EnquiryStatusCard enquiry={enquiry} t={t} />
          <EnquiryResidenceCard
            enquiry={enquiry}
            t={t}
            reserve={<EnquiryReserve enquiry={enquiry} t={t} />}
            link={<LinkResidenceForm enquiryId={enquiry.id} t={t.enquiry} />}
          />
        </div>
      </div>
    </>
  );
}
