"use client";

import { Fragment, useEffect, useRef, useState } from "react";

import { Button, ButtonArrow } from "@/components/ui/button";
import { Switcher } from "@/components/ui/switcher";
import type { Dictionary } from "@/content";
import { sectionHref } from "@/content/navigation";
import { prefersReducedMotion } from "@/lib/motion";

import { HeroRender, type TimeOfDay } from "./hero-render";

const PARALLAX_RATE = 0.4;
const PARALLAX_MAX_PX = 120;
const CONTENT_FADE_END = 0.6;
const WORD_STAGGER_MS = 80;
const TITLE_DELAY_MS = 300;

type HeroProps = {
  t: Pick<Dictionary, "hero" | "a11y">;
};

export function Hero({ t }: HeroProps) {
  const { hero } = t;
  const [time, setTime] = useState<TimeOfDay>("day");
  const sectionRef = useRef<HTMLElement>(null);
  const renderRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let frame = 0;
    const apply = () => {
      frame = 0;
      const section = sectionRef.current;
      if (!section || !renderRef.current || !contentRef.current) return;
      const height = section.offsetHeight;
      const y = Math.min(window.scrollY, height);
      renderRef.current.style.transform = `translate3d(0, ${Math.min(y * PARALLAX_RATE, PARALLAX_MAX_PX)}px, 0)`;
      contentRef.current.style.opacity = String(Math.max(0, 1 - y / (height * CONTENT_FADE_END)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const words = hero.title.split(" ");
  const afterTitle = { animationDelay: `${TITLE_DELAY_MS + words.length * WORD_STAGGER_MS + 300}ms` };

  return (
    <section
      ref={sectionRef}
      data-theme="dark"
      aria-labelledby="hero-title"
      className="relative h-svh min-h-[640px] overflow-hidden bg-dark lg:h-[min(100svh,62.5vw)] lg:min-h-[600px]"
    >
      <div
        ref={renderRef}
        className="absolute top-[300px] left-1/2 w-[181.2%] -translate-x-1/2 will-change-transform lg:top-[3.75vw] lg:left-0 lg:w-full lg:translate-x-0"
      >
        <HeroRender time={time} dayAlt={hero.renderDayAlt} eveningAlt={hero.renderEveningAlt} />
        <div className="absolute inset-x-0 -top-px h-[120px] bg-linear-to-b from-dark to-transparent lg:hidden" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[220px] bg-linear-to-b from-transparent via-dark/85 via-55% to-dark lg:hidden" />
      <div className="absolute inset-0 hidden hero-shade lg:block" />

      <div ref={contentRef} className="relative flex h-full flex-col">
        <div className="container-page flex flex-col gap-4 pt-24 lg:mt-auto lg:items-center lg:gap-0 lg:pt-0 lg:pb-11 lg:text-center">
          <p className="animate-rise text-overline text-primary lg:text-foreground">{hero.overline}</p>
          <h1 id="hero-title" className="text-display text-foreground lg:mt-6 lg:text-balance">
            {words.map((word, index) => (
              <Fragment key={`${word}-${index}`}>
                {index > 0 && " "}
                <span
                  className="inline-block animate-rise"
                  style={{ animationDelay: `${TITLE_DELAY_MS + index * WORD_STAGGER_MS}ms` }}
                >
                  {word}
                </span>
              </Fragment>
            ))}
          </h1>
          <p
            className="animate-rise text-body text-muted-foreground lg:mt-5 lg:text-[1.125rem] lg:leading-[1.875rem] lg:text-foreground/85"
            style={afterTitle}
          >
            {hero.subtitle}
          </p>
          <Button asChild className="mt-10 hidden animate-rise lg:inline-flex" style={afterTitle}>
            <a href={sectionHref("residences")}>
              {hero.cta}
              <ButtonArrow />
            </a>
          </Button>
        </div>

        <div className="container-page mt-auto flex flex-col gap-4 pb-8 lg:mt-0 lg:flex-row lg:items-center lg:justify-between lg:pb-[31px]">
          <div className="hidden items-center gap-4 lg:flex">
            <span aria-hidden="true" className="h-px w-12 origin-left animate-cue bg-primary" />
            <span className="text-caption text-foreground">{hero.scrollCue}</span>
          </div>
          <div className="flex items-center justify-between lg:gap-4">
            <span className="text-caption text-muted-foreground">{hero.seeTheHouse}</span>
            <Switcher
              label={t.a11y.timeOfDay}
              value={time}
              onValueChange={setTime}
              options={[
                { value: "day", label: hero.day },
                { value: "evening", label: hero.evening },
              ]}
            />
          </div>
          <Button asChild className="w-full lg:hidden">
            <a href={sectionHref("residences")}>
              {hero.ctaMobile}
              <ButtonArrow />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
