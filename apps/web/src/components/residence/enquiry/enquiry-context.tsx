"use client";

import { createContext, use, useState, type ComponentProps, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/content";
import type { Residence } from "@/lib/api/residences";

import { EnquiryDialog } from "./enquiry-dialog";

const OpenEnquiryContext = createContext<() => void>(() => undefined);

type EnquiryProviderProps = {
  residence: Residence;
  t: Dictionary;
  children: ReactNode;
};

/** One enquiry form per page: every "Request this residence" button opens it with the residence filled in. */
export function EnquiryProvider({ residence, t, children }: EnquiryProviderProps) {
  const [open, setOpen] = useState(false);
  return (
    <OpenEnquiryContext value={() => setOpen(true)}>
      {children}
      <EnquiryDialog open={open} onOpenChange={setOpen} residence={residence} t={t} />
    </OpenEnquiryContext>
  );
}

export function RequestButton(props: Omit<ComponentProps<typeof Button>, "onClick" | "type">) {
  const openEnquiry = use(OpenEnquiryContext);
  return <Button type="button" aria-haspopup="dialog" onClick={openEnquiry} {...props} />;
}
