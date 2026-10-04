import { cn } from "@/lib/utils";

type LogoProps = {
  size?: "default" | "small" | "responsive";
  className?: string;
};

const wordmarkSize = {
  default: "text-[28px]",
  small: "text-[22px]",
  responsive: "text-[22px] lg:text-[28px]",
};

const descriptorSize = {
  default: "text-[9px]",
  small: "text-[8px]",
  responsive: "text-[8px] lg:text-[9px]",
};

export function Logo({ size = "default", className }: LogoProps) {
  return (
    <span className={cn("inline-flex flex-col items-center gap-0.5 whitespace-nowrap", className)}>
      <span className={cn(wordmarkSize[size], "-mr-[0.24em] font-serif leading-none tracking-[0.24em] text-foreground")}>
        AURORA
      </span>
      <span className={cn(descriptorSize[size], "-mr-[0.48em] leading-normal font-semibold tracking-[0.48em] text-primary")}>
        RESIDENCE
      </span>
    </span>
  );
}
