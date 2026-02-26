// app/[locale]/layout.tsx
import type { ReactNode } from "react";
import type { Locale } from "@/app/lib/i18n/config";
import Header from "@/components/layout/Header";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  return (
    <>
      <Header locale={locale} />
      {children}
    </>
  );
}
