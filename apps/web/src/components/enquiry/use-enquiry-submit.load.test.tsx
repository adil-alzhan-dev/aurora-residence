// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import type { FormEvent } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { EnquiryValues } from "./enquiry-schema";
import { lazyEnquiryResolver } from "./lazy-enquiry-resolver";
import { useEnquirySubmit } from "./use-enquiry-submit";

const chunks = vi.hoisted(() => ({ requestFails: 0, schemaFails: 0 }));

function failedChunk(): never {
  throw new Error("Failed to fetch dynamically imported module");
}

vi.mock("@/lib/api/enquiries", async (importOriginal) => {
  if (chunks.requestFails > 0) {
    chunks.requestFails -= 1;
    failedChunk();
  }
  return importOriginal();
});

vi.mock("./enquiry-schema", async (importOriginal) => {
  if (chunks.schemaFails > 0) {
    chunks.schemaFails -= 1;
    failedChunk();
  }
  return importOriginal();
});

const values: EnquiryValues = {
  name: "Elena Marsh",
  code: "+1",
  phone: "555 014 2271",
  email: "elena.marsh@example.com",
  consent: true,
  website: "",
};

const submitEvent = { preventDefault: () => undefined, persist: () => undefined } as unknown as FormEvent<HTMLFormElement>;

function renderSubmit(resolver?: Resolver<EnquiryValues>) {
  const onSent = vi.fn();
  const onSendingChange = vi.fn();
  const hook = renderHook(() => {
    const form = useForm<EnquiryValues>({ resolver, defaultValues: values });
    return useEnquirySubmit(form, { source: "Contacts form", locale: "en" }, { onSent, onSendingChange });
  });
  return { ...hook, onSent, onSendingChange };
}

async function submitOnce(submit: () => Promise<void>) {
  let rejected = false;
  await act(async () => {
    await submit().catch(() => {
      rejected = true;
    });
  });
  return rejected;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  chunks.requestFails = 0;
  chunks.schemaFails = 0;
});

describe("useEnquirySubmit when a script chunk fails to load", () => {
  it("unlocks the form and shows the general error when the request chunk fails", async () => {
    chunks.requestFails = 1;
    const { result, onSendingChange } = renderSubmit();

    const rejected = await submitOnce(() => result.current.submit(submitEvent));

    expect({ sending: result.current.sending, alert: result.current.alert, rejected }).toEqual({
      sending: false,
      alert: { kind: "failed" },
      rejected: false,
    });
    expect(onSendingChange).toHaveBeenLastCalledWith(false);
  });

  it("loads the request chunk again on the next send and delivers the enquiry", async () => {
    chunks.requestFails = 1;
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ residence: null }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const { result, onSent } = renderSubmit();

    await submitOnce(() => result.current.submit(submitEvent));
    expect(fetchMock).not.toHaveBeenCalled();

    const rejected = await submitOnce(() => result.current.submit(submitEvent));
    expect(rejected).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(onSent).toHaveBeenCalledTimes(1);
    expect(result.current).toMatchObject({ sending: false, alert: null });
  });

  it("explains a validation chunk that failed and validates again on the next send", async () => {
    chunks.schemaFails = 1;
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ residence: null }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const resolver = lazyEnquiryResolver({ name: "Name", code: "Code", phone: "Phone", email: "Email", consent: "Consent" });
    const { result, onSent, onSendingChange } = renderSubmit(resolver);

    const rejected = await submitOnce(() => result.current.submit(submitEvent));
    expect({ sending: result.current.sending, alert: result.current.alert, rejected }).toEqual({
      sending: false,
      alert: { kind: "unloaded" },
      rejected: false,
    });
    expect(onSendingChange).not.toHaveBeenCalledWith(true);

    await submitOnce(() => result.current.submit(submitEvent));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(onSent).toHaveBeenCalledTimes(1);
    expect(result.current.alert).toBeNull();
  });
});
