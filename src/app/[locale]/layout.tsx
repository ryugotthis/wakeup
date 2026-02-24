// app/[locale]/layout.tsx
import { notFound } from "next/navigation";
import { SUPPORTED_LOCALES, type Locale } from "@/app/lib/i18n/config";
// @/lib/i18n/config

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!SUPPORTED_LOCALES.includes(locale as Locale)) notFound();

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
