"use client";

import { useMemo } from "react";

import {
  useAdminResidences,
  useDashboardSummary,
  useLatestEnquiries,
  useReservationCards,
} from "@/lib/admin/queries";

/** Everything the dashboard shows, ready only when every request has answered. */
export function useDashboardData() {
  const summary = useDashboardSummary();
  const residences = useAdminResidences();
  const enquiries = useLatestEnquiries();

  const reservedNumbers = useMemo(
    () => residences.data?.items.filter((item) => item.status === "RESERVED").map((item) => item.number) ?? [],
    [residences.data],
  );
  const cards = useReservationCards(reservedNumbers);

  const base = [summary, residences, enquiries];
  const isError = base.some((query) => query.isError) || cards.some((query) => query.isError);
  const isPending = base.some((query) => query.isPending) || cards.some((query) => query.isPending);

  const clients = new Map<string, string | null>();
  for (const card of cards) {
    if (card.data) clients.set(card.data.number, card.data.reservation?.enquiry?.name ?? null);
  }

  function retry() {
    for (const query of [...base, ...cards]) {
      if (query.isError) void query.refetch();
    }
  }

  if (isError) return { state: "error" as const, retry };
  if (isPending || !summary.data || !residences.data || !enquiries.data) return { state: "pending" as const };
  return {
    state: "ready" as const,
    summary: summary.data,
    residences: residences.data.items,
    enquiries: enquiries.data,
    clients,
  };
}
