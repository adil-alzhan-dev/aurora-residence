import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import localFont from "next/font/local";

import { getLocale, getSiteDictionary } from "@/lib/locale-server";

import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500"],
  variable: "--font-cormorant",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-manrope",
  display: "swap",
});

// Figma sets digits inside Cormorant headings in Manrope Light, so the digit face is fixed at 300.
const liningDigits = localFont({
  src: "../fonts/manrope-latin-wght.woff2",
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
