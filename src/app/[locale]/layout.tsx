// app/[locale]/layout.tsx
import type { ReactNode } from "react";
import type { Locale } from "@/app/lib/i18n/config";
import Header from "@/components/layout/Hearder";

export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  return (
    <html lang={locale}>
      <body>
        <Header locale={locale} />
        {children}
      </body>
    </html>
  );
}
