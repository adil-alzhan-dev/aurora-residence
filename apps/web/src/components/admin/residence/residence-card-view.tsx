"use client";

import { useState } from "react";

import { DashboardError } from "@/components/admin/dashboard/dashboard-states";
import type { AdminDictionary } from "@/content/en-admin";
import { AdminApiError } from "@/lib/admin/api-client";
import { useResidenceCard } from "@/lib/admin/queries";

import { PriceStatusCard } from "./price-status-card";
import { ReservationCard } from "./reservation-card";
import { ResidenceEnquiries } from "./residence-enquiries";
import { BackToResidences, ResidenceHeading } from "./residence-heading";
import { ResidenceHistory } from "./residence-history";
import { ResidenceNotFound } from "./residence-not-found";
import { ResidenceOverview } from "./residence-overview";

function CardSkeleton({ label }: { label: string }) {
  const block = "rounded-base border border-border bg-card";
  return (
    <div role="status" aria-live="polite" className="flex animate-pulse flex-col gap-6 xl:flex-row">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="flex flex-1 flex-col gap-6">
        <div className={`${block} h-68`} />
        <div className={`${block} h-66`} />
      </div>
      <div aria-hidden="true" className={`${block} h-80 xl:w-100`} />
    </div>
  );
}

export function ResidenceCardView({ number, t }: { number: string; t: AdminDictionary }) {
  const { data: residence, error, refetch } = useResidenceCard(number);
  const [now] = useState(() => new Date());
  const text = t.residence;

  if (error instanceof AdminApiError && (error.status === 404 || error.status === 400)) {
    return <ResidenceNotFound t={text} />;
  }
  if (!residence) {
    return (
      <>
        <BackToResidences label={text.back} />
        {error ? <DashboardError t={t.states} onRetry={() => void refetch()} /> : <CardSkeleton label={t.states.loading} />}
      </>
    );
  }

  return (
    <>
      <BackToResidences label={text.back} />
      <ResidenceHeading residence={residence} t={text} statuses={t.facade.statuses} />
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <ResidenceOverview residence={residence} t={text} />
          <PriceStatusCard residence={residence} t={t} />
          <ResidenceHistory history={residence.history} t={text.history} statuses={t.facade.statuses} />
        </div>
        <div className="flex flex-col gap-6 xl:w-100 xl:shrink-0">
          <ReservationCard residence={residence} now={now} t={t} />
          <ResidenceEnquiries number={residence.number} now={now} t={t} />
        </div>
      </div>
    </>
  );
}
