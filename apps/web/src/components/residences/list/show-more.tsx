import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/content";
import { fillTemplate } from "@/lib/format";
import { cn } from "@/lib/utils";

type ShowMoreProps = {
  shown: number;
  total: number;
  hasMore: boolean;
  onMore: () => void;
  t: Pick<Dictionary["list"], "showing" | "showMore">;
  className?: string;
};

export function ShowMore({ shown, total, hasMore, onMore, t, className }: ShowMoreProps) {
  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <p aria-live="polite" className="text-caption text-muted-foreground">
        {fillTemplate(t.showing, { shown, total })}
      </p>
      {hasMore && (
        <Button variant="secondary" onClick={onMore} className="max-lg:w-full">
          {t.showMore}
        </Button>
      )}
    </div>
  );
}
