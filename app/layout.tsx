import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import { getServerDict, getServerLang } from "@/lib/i18n/server";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getServerDict();
  return {
    title: "Kosmo Tournaments",
    description: dict["app.meta_description"],
  };
}

export const viewport: Viewport = {
  themeColor: "#f0f2f5",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = await getServerLang();
  return (
    <html lang={lang} className={`${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <LanguageProvider initialLang={lang}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
