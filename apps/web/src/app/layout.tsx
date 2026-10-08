import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import localFont from "next/font/local";

import { getLocale, getSiteDictionary } from "@/lib/locale-server";

import "./globals.css";

// Only the latin files are preloaded (EN is the default); the cyrillic ones still load by unicode-range on RU pages.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-cormorant",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-manrope",
  display: "swap",
});

// Figma sets digits inside Cormorant headings in Manrope Light, so the digit face is fixed at 300.
// The file is Manrope's variable latin font cut down to the glyphs 0-9.
const liningDigits = localFont({
  src: "../fonts/manrope-digits-wght.woff2",
  weight: "300",
  variable: "--font-digits",
  display: "swap",
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0030-0039" }],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getSiteDictionary();
  return { title: t.meta.title, description: t.meta.description };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={await getLocale()} className={`${cormorant.variable} ${manrope.variable} ${liningDigits.variable}`}>
      <body>{children}</body>
    </html>
  );
}
