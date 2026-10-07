// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getDictionary } from "@/content";
import { allResidences } from "@/lib/__fixtures__/residences";

import { EnquiryProvider, RequestButton } from "./enquiry-context";

const t = getDictionary();
const residence = allResidences.find((item) => item.number === "7.03")!;

function deferFetch() {
  let answer: (response: Response) => void = () => undefined;
  const fetchMock = vi.fn(
    () =>
      new Promise<Response>((resolve) => {
        answer = resolve;
      }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, answer: (response: Response) => answer(response) };
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

let rerender: (ui: ReactElement) => void = () => undefined;

async function openAndSend(
  ui: ReactElement = (
    <EnquiryProvider residence={residence} t={t}>
      <RequestButton>Request this residence</RequestButton>
    </EnquiryProvider>
  ),
  text = t,
) {
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  rerender = render(ui).rerender;
  await user.click(screen.getByRole("button", { name: "Request this residence" }));
  await user.type(screen.getByLabelText(text.residenceEnquiry.nameLabel), "Elena Marsh");
  await user.selectOptions(screen.getByLabelText(text.enquiry.countryCode), "+1");
  await user.type(screen.getByLabelText(text.enquiry.phone), "555 014 2271");
  await user.type(screen.getByLabelText(text.enquiry.email), "elena.marsh@example.com");
  await user.click(screen.getByRole("checkbox"));
  await user.click(screen.getByRole("button", { name: text.residenceEnquiry.submit }));
  return user;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("EnquiryDialog while a request is out", () => {
  it("cannot be closed by the close button, Escape or a click outside and sends only once", async () => {
    const { fetchMock, answer } = deferFetch();
    const user = await openAndSend();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const close = screen.getByRole("button", { name: t.residenceEnquiry.close });
    expect(close.getAttribute("aria-disabled")).toBe("true");

    await user.click(close);
    await user.keyboard("{Escape}");
    await user.click(document.body);

    expect(screen.getByRole("dialog")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: new RegExp(t.enquirySend.sending) }));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    answer(json(201, { residence: "7.03" }));
    expect(await screen.findByText(t.enquirySend.success.overline)).toBeTruthy();
    expect(close.hasAttribute("aria-disabled")).toBe(false);
  });

  it("keeps the values after a late error and can be closed again", async () => {
    const { answer } = deferFetch();
    const user = await openAndSend();

    await user.keyboard("{Escape}");
    answer(json(500, {}));

    expect(await screen.findByText(new RegExp(t.enquirySend.failedBefore.slice(0, 20)))).toBeTruthy();
    expect((screen.getByLabelText(t.residenceEnquiry.nameLabel) as HTMLInputElement).value).toBe("Elena Marsh");
    expect((screen.getByLabelText(t.enquiry.phone) as HTMLInputElement).value).toBe("555 014 2271");
    expect((screen.getByLabelText(t.enquiry.email) as HTMLInputElement).value).toBe("elena.marsh@example.com");

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});

describe("EnquiryDialog in Russian", () => {
  const ru = getDictionary("ru");

  it("answers a sale in Russian and sends the enquiry with locale RU", async () => {
    const { fetchMock, answer } = deferFetch();
    const ui = (
      <EnquiryProvider residence={residence} t={ru}>
        <RequestButton>Request this residence</RequestButton>
      </EnquiryProvider>
    );
    await openAndSend(ui, ru);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({ locale: "RU", source: "Residence page" });

    answer(json(400, { message: "Residence 7.03 is already sold, please choose another one" }));

    expect(await screen.findByText(ru.enquirySend.soldRejected)).toBeTruthy();
    expect(screen.queryByText(/already sold/)).toBeNull();
  });
});

describe("EnquiryProvider after a live update", () => {
  const tree = (status: typeof residence.status) => (
    <EnquiryProvider residence={{ ...residence, status }} t={t}>
      <RequestButton>Request this residence</RequestButton>
    </EnquiryProvider>
  );

  it("closes the form when the residence is sold and does not reopen it later", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const { rerender } = render(tree("available"));
    await user.click(screen.getByRole("button", { name: "Request this residence" }));

    rerender(tree("sold"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    rerender(tree("available"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  async function sellWhileSending() {
    const { fetchMock, answer } = deferFetch();
    const user = await openAndSend(tree("available"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    rerender(tree("sold"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    return { user, answer };
  }

  const reopen = async (user: ReturnType<typeof userEvent.setup>) => {
    rerender(tree("available"));
    await user.click(screen.getByRole("button", { name: "Request this residence" }));
    return screen.getByRole("button", { name: t.residenceEnquiry.close });
  };

  it("can close the form again after a sale during sending and a late answer", async () => {
    const { user, answer } = await sellWhileSending();
    await act(async () => answer(json(201, { residence: "7.03" })));

    const close = await reopen(user);
    expect(close.hasAttribute("aria-disabled")).toBe(false);
    expect(screen.queryByText(t.enquirySend.success.overline)).toBeNull();
    await user.click(close);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    await reopen(user);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("ignores the late answer of the sold form in a form opened after it", async () => {
    const { user, answer } = await sellWhileSending();
    await reopen(user);

    await act(async () => answer(json(201, { residence: "7.03" })));

    expect(screen.queryByText(t.enquirySend.success.overline)).toBeNull();
    expect(screen.getByRole("button", { name: t.residenceEnquiry.submit })).toBeTruthy();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});
