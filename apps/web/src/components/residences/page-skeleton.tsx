import { cn } from "@/lib/utils";

type PageSkeletonProps = {
  theme: "light" | "dark";
  label: string;
};

/** Shown while the server loads fresh availability: the page frame without numbers. */
export function PageSkeleton({ theme, label }: PageSkeletonProps) {
  const block = "animate-pulse rounded-base bg-card";
  return (
    <section data-theme={theme} aria-busy="true" aria-label={label} className="bg-background pt-(--header-height)">
      <div className="container-page flex flex-col gap-4 py-8 lg:py-16">
        <div className={cn(block, "h-4 w-32")} />
        <div className={cn(block, "h-12 w-3/4 max-w-[552px] lg:h-18")} />
        <div className={cn(block, "h-5 w-2/3 max-w-[520px]")} />
      </div>
      <div className="container-page pb-24">
        <div className={cn(block, "aspect-[390/389] w-full lg:aspect-[1440/700]")} />
      </div>
    </section>
  );
}
