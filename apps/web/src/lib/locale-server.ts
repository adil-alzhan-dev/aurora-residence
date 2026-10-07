import { cookies } from "next/headers";
import { cache } from "react";

import { getDictionary } from "@/content";

import { LOCALE_COOKIE, parseLocale } from "./locale";

/** One read of the language cookie per request, shared by layouts, pages and metadata. */
export const getLocale = cache(async () => parseLocale((await cookies()).get(LOCALE_COOKIE)?.value));

export const getSiteDictionary = cache(async () => getDictionary(await getLocale()));
