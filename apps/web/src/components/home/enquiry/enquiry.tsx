import { RevealSection } from "@/components/motion/reveal-section";
import type { Dictionary } from "@/content";
import { contactLinks, type SectionId } from "@/content/navigation";
import { revealDelay } from "@/lib/motion";

import { EnquiryPanel } from "./enquiry-panel";

type EnquiryProps = {
  t: Pick<Dictionary, "enquiry" | "enquirySend" | "contacts">;
};

type Contact = { title: string; value: string; note: string; href?: string };

export function Enquiry({ t }: EnquiryProps) {
  const { enquiry, contacts } = t;
  const items: Contact[] = [
    { title: enquiry.phoneTitle, value: contacts.phone, note: contacts.hours, href: contactLinks.phone },
    { title: enquiry.emailTitle, value: contacts.email, note: enquiry.emailNote, href: contactLinks.email },
    { title: enquiry.galleryTitle, value: enquiry.galleryPlace, note: enquiry.galleryNote },
  ];

  return (
    <RevealSection
      id={"contacts" satisfies SectionId}
      data-theme="dark"
      aria-labelledby="contacts-title"
      className="bg-background py-16 scheme-dark lg:py-32"
    >
      <div className="container-page flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,624px)_minmax(0,514px)] lg:justify-between lg:gap-8">
        <div className="flex flex-col gap-8 lg:gap-14">
          <div data-reveal="up" className="flex flex-col gap-4 lg:gap-6">
            <p className="text-overline text-primary">{enquiry.overline}</p>
            <h2 id="contacts-title" className="text-h2 text-foreground lg:text-h1">
              {enquiry.title}
            </h2>
            <p className="text-body text-muted-foreground lg:text-body-l">{enquiry.lead}</p>
          </div>
          <ul data-reveal="up" style={revealDelay(120)} className="flex flex-col lg:flex-row lg:flex-wrap lg:gap-x-12 lg:gap-y-6">
            {items.map((item) => (
              <li
                key={item.title}
                className="flex flex-col gap-1 border-b border-border py-4 lg:gap-2 lg:border-none lg:py-0"
              >
                <p className="text-overline text-muted-foreground">{item.title}</p>
                {item.href ? (
                  <a
                    href={item.href}
                    className="-my-2 self-start py-2 text-body-l text-foreground transition-colors duration-200 hover:text-primary lg:my-0 lg:py-0 lg:text-body"
                  >
                    {item.value}
                  </a>
                ) : (
                  <p className="text-body-l text-foreground lg:text-body">{item.value}</p>
                )}
                <p className="text-caption text-muted-foreground">{item.note}</p>
              </li>
            ))}
          </ul>
        </div>
        <div data-reveal="up" style={revealDelay(240)}>
          <EnquiryPanel t={t} />
        </div>
      </div>
    </RevealSection>
  );
}
