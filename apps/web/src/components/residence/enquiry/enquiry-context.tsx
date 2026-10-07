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

/**
 * One enquiry form per page: every "Request this residence" button opens it with the residence filled in.
 * A residence sold while the form is open closes it, as the page then offers no request at all.
 * That close bypasses the dialog's own handler, so the dialog is mounted anew: a request still out
 * keeps no "sending" lock and its late answer reaches only the form that is already gone.
 */
export function EnquiryProvider({ residence, t, children }: EnquiryProviderProps) {
  const [open, setOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  if (open && residence.status === "sold") {
    setOpen(false);
    setDialogKey((key) => key + 1);
  }
  return (
    <OpenEnquiryContext value={() => setOpen(true)}>
      {children}
      <EnquiryDialog key={dialogKey} open={open} onOpenChange={setOpen} residence={residence} t={t} />
    </OpenEnquiryContext>
  );
}

export function RequestButton(props: Omit<ComponentProps<typeof Button>, "onClick" | "type">) {
  const openEnquiry = use(OpenEnquiryContext);
  return <Button type="button" aria-haspopup="dialog" onClick={openEnquiry} {...props} />;
}
