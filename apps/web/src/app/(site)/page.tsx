import { About } from "@/components/home/about";
import { Advantages } from "@/components/home/advantages";
import { Enquiry } from "@/components/home/enquiry/enquiry";
import { Gallery } from "@/components/home/gallery/gallery";
import { Hero } from "@/components/home/hero";
import { Location } from "@/components/home/location/location";
import { ConstructionProgress } from "@/components/home/progress/construction-progress";
import { ResidencePicker } from "@/components/home/residences/residence-picker";
import { Stats } from "@/components/home/stats";
import { getFloorSummaries } from "@/lib/api/floors";
import { getSiteDictionary } from "@/lib/locale-server";

export default async function HomePage() {
  const [t, floors] = await Promise.all([getSiteDictionary(), getFloorSummaries()]);
  return (
    <>
      <Hero t={{ hero: t.hero, a11y: t.a11y }} />
      <Stats t={t} />
      <About t={t} />
      <Advantages t={t} />
      <ResidencePicker floors={floors} t={{ residencePicker: t.residencePicker, status: t.status }} />
      <Gallery t={{ gallery: t.gallery }} />
      <Location t={{ location: t.location }} />
      <ConstructionProgress t={{ progress: t.progress }} />
      <Enquiry t={{ enquiry: t.enquiry, enquirySend: t.enquirySend, contacts: t.contacts }} />
    </>
  );
}
