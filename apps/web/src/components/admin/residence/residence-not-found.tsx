import type { AdminDictionary } from "@/content/en-admin";

import { BackToResidences } from "./residence-heading";

export function ResidenceNotFound({ t }: { t: AdminDictionary["residence"] }) {
  return (
    <>
      <BackToResidences label={t.back} />
      <h1 className="text-admin-title text-foreground">{t.notFound.title}</h1>
      <p className="text-admin-body text-muted-foreground">{t.notFound.text}</p>
    </>
  );
}
