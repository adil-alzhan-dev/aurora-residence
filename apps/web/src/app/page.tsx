import { About } from "@/components/home/about";
import { Advantages } from "@/components/home/advantages";
import { Hero } from "@/components/home/hero";
import { Stats } from "@/components/home/stats";
import { getDictionary } from "@/content";

export default function HomePage() {
  const t = getDictionary("en");
  return (
    <>
      <Hero t={{ hero: t.hero, a11y: t.a11y }} />
      <Stats t={t} />
      <About t={t} />
      <Advantages t={t} />
    </>
  );
}
