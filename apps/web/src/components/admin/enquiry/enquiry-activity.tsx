import { useAdminFormat } from "@/components/admin/admin-locale";
import { AdminCard } from "@/components/admin/residence/admin-card";
import type { AdminDictionary } from "@/content/en-admin";
import { authorText } from "@/lib/admin/api-texts";
import { formatReceived } from "@/lib/admin/dashboard-view";
import { activityLine } from "@/lib/admin/enquiry-view";
import type { EnquiryActivity as Entry } from "@/lib/admin/schemas";

type ActivityProps = { activity: Entry[]; now: Date; t: AdminDictionary };

export function EnquiryActivity({ activity, now, t }: ActivityProps) {
  const format = useAdminFormat();
  const texts = {
    activity: t.enquiry.activity,
    enquiryStatuses: t.enquiries.statuses,
    residenceStatuses: t.facade.statuses,
    messages: t.messages,
  };
  return (
    <AdminCard id="enquiry-activity" title={t.enquiry.activity.title} className="gap-3">
      {activity.length === 0 ? (
        <p className="text-admin-body text-muted-foreground">{t.enquiry.activity.empty}</p>
      ) : (
        <ol className="flex flex-col">
          {activity.map((entry, index) => {
            const line = activityLine(entry, texts, format);
            return (
              <li
                key={`${entry.at.toISOString()}-${index}`}
                className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 border-t border-border py-3 sm:grid-cols-[120px_1fr_auto] sm:items-center"
              >
                <time dateTime={entry.at.toISOString()} className="text-admin-caption text-muted-foreground">
                  {formatReceived(entry.at, now, t.enquiries, format)}
                </time>
                <div className="col-span-2 row-start-2 flex flex-col sm:col-span-1 sm:row-start-auto">
                  <span className="text-admin-body whitespace-pre-wrap text-foreground">{line.text}</span>
                  {line.note && <span className="text-admin-caption text-muted-foreground">{line.note}</span>}
                </div>
                <span className="col-start-2 row-start-1 text-admin-caption whitespace-nowrap text-muted-foreground sm:col-start-auto sm:row-start-auto">
                  {authorText(entry.author, t.messages)}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </AdminCard>
  );
}
