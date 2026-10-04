import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { ArrowRightIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex min-h-12 items-center justify-center gap-3 rounded-base py-4 text-label whitespace-nowrap transition-colors duration-200 disabled:pointer-events-none aria-disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary:
          "bg-primary px-8 text-primary-foreground hover:bg-primary-hover disabled:bg-disabled disabled:text-disabled-foreground",
        secondary:
          "border border-foreground px-8 text-foreground hover:bg-foreground hover:text-background disabled:border-border disabled:text-disabled-foreground",
        ghost: "px-0 text-foreground hover:text-primary disabled:text-disabled-foreground",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({ className, variant, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant }), className)} {...props} />;
}

function ButtonArrow() {
  return (
    <ArrowRightIcon className="shrink-0 transition-transform duration-200 ease-out group-hover/button:translate-x-1" />
  );
}

export { Button, ButtonArrow, buttonVariants };
