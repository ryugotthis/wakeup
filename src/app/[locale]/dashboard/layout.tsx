// src/app/[locale]/dashboard/layout.tsx
import DashboardSidebar from "./DashboardSidebar";
import type { Locale as RouteLocale } from "@/app/lib/i18n/config";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: RouteLocale }>;
}) {
  const { locale } = await params;

  return (
    <main className="min-h-screen bg-[#DBEBF1]/40">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-[280px_1fr] gap-6">
          {/* Sidebar */}
          <DashboardSidebar locale={locale} />

          {/* Main content */}
          <section className="min-w-0">{children}</section>
        </div>
      </div>
    </main>
  );
}
