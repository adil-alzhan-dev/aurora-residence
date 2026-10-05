// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import type { FormEvent } from "react";
import { useForm } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { EnquiryValues } from "./enquiry-schema";
import { useEnquirySubmit } from "./use-enquiry-submit";

const values: EnquiryValues = {
  name: "Elena Marsh",
  code: "+1",
  phone: "555 014 2271",
  email: "elena.marsh@example.com",
  consent: true,
  website: "",
};

const submitEvent = { preventDefault: () => undefined, persist: () => undefined } as unknown as FormEvent<HTMLFormElement>;

function renderSubmit() {
  const onSent = vi.fn();
  const onSendingChange = vi.fn();
  const hook = renderHook(() => {
    const form = useForm<EnquiryValues>({ defaultValues: values });
    return useEnquirySubmit(form, { source: "Contacts form" }, { onSent, onSendingChange });
  });
  return { ...hook, onSent, onSendingChange };
}

function deferFetch() {
  const answers: ((response: Response) => void)[] = [];
  const fetchMock = vi.fn(() => new Promise<Response>((resolve) => answers.push(resolve)));
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, answers };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useEnquirySubmit", () => {
  it("sends once while a request is out and reports the sending state", async () => {
    const { fetchMock, answers } = deferFetch();
    const { result, onSent, onSendingChange } = renderSubmit();

    await act(async () => {
      void result.current.submit(submitEvent);
      void result.current.submit(submitEvent);
    });
    await waitFor(() => expect(result.current.sending).toBe(true));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(onSendingChange).toHaveBeenLastCalledWith(true);

    await act(async () => answers[0](new Response(JSON.stringify({ residence: null }), { status: 201 })));
    await waitFor(() => expect(onSent).toHaveBeenCalledTimes(1));
    expect(onSendingChange).toHaveBeenLastCalledWith(false);
  });

  it("ignores a late answer that arrives after the form is gone", async () => {
    const { answers } = deferFetch();
    const { result, unmount, onSent } = renderSubmit();

    await act(async () => {
      void result.current.submit(submitEvent);
    });
    await waitFor(() => expect(answers).toHaveLength(1));
    unmount();

    await act(async () => answers[0](new Response(JSON.stringify({ residence: null }), { status: 201 })));
    expect(onSent).not.toHaveBeenCalled();
  });
});
