// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import type { FormEvent } from "react";
import { useForm } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { EnquiryValues } from "./enquiry-schema";
import { toEnquiryPayload, useEnquirySubmit } from "./use-enquiry-submit";

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
    return useEnquirySubmit(form, { source: "Contacts form", locale: "en" }, { onSent, onSendingChange });
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
    // The request module loads with the first send, so the request itself follows a moment later.
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
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

  it("shows the form's own text for a field the API rejects in English", async () => {
    const apiMessage = "Enter a phone number with country code, for example +1 555 010 2040";
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ statusCode: 400, code: "VALIDATION_FAILED", message: [apiMessage], errors: { phone: apiMessage } }),
            { status: 400 },
          ),
      ),
    );
    const russian = "Введите номер: от 7 до 15 цифр вместе с кодом";
    const { result } = renderHook(() => {
      const form = useForm<EnquiryValues>({ defaultValues: values });
      const submit = useEnquirySubmit(form, { source: "Contacts form", locale: "ru" }, { onSent: vi.fn(), messages: { phone: russian } });
      return { form, submit };
    });

    await act(async () => {
      await result.current.submit.submit(submitEvent);
    });
    await waitFor(() => expect(result.current.form.getFieldState("phone").error?.message).toBe(russian));
  });

  it("never shows the API's English words, even for a field without its own text", async () => {
    const body = { statusCode: 400, code: "VALIDATION_FAILED", message: ["comment is too long"], errors: { comment: "comment is too long" } };
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status: 400 })));
    const { result } = renderHook(() => {
      const form = useForm<EnquiryValues>({ defaultValues: values });
      const submit = useEnquirySubmit(form, { source: "Contacts form", locale: "en" }, { onSent: vi.fn() });
      return { form, submit };
    });

    await act(async () => {
      await result.current.submit.submit(submitEvent);
    });
    await waitFor(() => expect(result.current.submit.alert).toEqual({ kind: "failed" }));
    expect(result.current.form.getFieldState("comment").error).toBeUndefined();
  });
});

describe("toEnquiryPayload", () => {
  it("sends the page language and keeps the source as the API expects it", () => {
    const payload = toEnquiryPayload(values, { source: "Residence page", residence: "7.03", locale: "ru" });
    expect(payload).toMatchObject({ locale: "RU", source: "Residence page", residence: "7.03" });
    expect(toEnquiryPayload(values, { source: "Contacts form", locale: "en" })).toMatchObject({
      locale: "EN",
      source: "Contacts form",
    });
  });
});
