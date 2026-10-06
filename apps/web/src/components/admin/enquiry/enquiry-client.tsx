import { AdminCard } from "@/components/admin/residence/admin-card";
import type { AdminDictionary } from "@/content/en-admin";
import type { EnquiryCard } from "@/lib/admin/schemas";

type Texts = AdminDictionary["enquiry"];

export function EnquiryClient({ enquiry, t }: { enquiry: EnquiryCard; t: Texts }) {
  const text = t.client;
  const fields = [
    { label: text.name, value: enquiry.name },
    { label: text.phone, value: <a href={`tel:${enquiry.phone.replace(/[^\d+]/g, "")}`}>{enquiry.phone}</a> },
    { label: text.email, value: <a href={`mailto:${enquiry.email}`}>{enquiry.email}</a> },
    { label: text.locale, value: text.locales[enquiry.locale.toLowerCase()] ?? enquiry.locale },
    { label: text.currency, value: enquiry.currency },
    { label: text.source, value: enquiry.source },
  ];
  return (
    <AdminCard id="enquiry-client" title={text.title} className="gap-4">
      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 md:grid-cols-[repeat(3,minmax(0,196px))]">
        {fields.map((field) => (
          <div key={field.label} className="flex min-w-0 flex-col gap-1">
            <dt className="text-label text-muted-foreground">{field.label}</dt>
            <dd className="text-admin-body break-words text-foreground [&_a]:transition-colors [&_a]:hover:text-primary">
              {field.value}
            </dd>
          </div>
        ))}
      </dl>
    </AdminCard>
  );
}

export function EnquiryComment({ comment, t }: { comment: string | null; t: Texts }) {
  return (
    <AdminCard id="enquiry-comment" title={t.comment.title} className="gap-3">
      {comment ? (
        <blockquote className="border-l-2 border-primary pl-4 text-admin-body whitespace-pre-line text-foreground">
          {comment}
        </blockquote>
      ) : (
        <p className="text-admin-body text-muted-foreground">{t.comment.empty}</p>
      )}
    </AdminCard>
  );
}
