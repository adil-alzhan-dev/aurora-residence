import { Button } from "@/components/ui/button";
import type { AdminDictionary } from "@/content/en-admin";

const block = "rounded-base border border-border bg-card";

export function DashboardSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="flex animate-pulse flex-col gap-6">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className={`${block} h-40`} />
        ))}
      </div>
      <div aria-hidden="true" className="flex flex-col gap-4 xl:flex-row">
        <div className={`${block} h-[436px] xl:w-[420px]`} />
        <div className={`${block} h-[436px] flex-1`} />
      </div>
      <div aria-hidden="true" className={`${block} h-[412px]`} />
    </div>
  );
}

export function DashboardError({ t, onRetry }: { t: AdminDictionary["states"]; onRetry: () => void }) {
  return (
    <div role="alert" className={`${block} flex flex-col items-start gap-4 p-6`}>
      <p className="text-admin-body text-foreground">{t.loadFailed}</p>
      <Button variant="secondary" onClick={onRetry}>
        {t.retry}
      </Button>
    </div>
  );
}
