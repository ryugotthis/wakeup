import DashboardSidebar from "./DashboardSidebar";
import type { Locale as RouteLocale } from "@/app/lib/i18n/config";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <main className="min-h-screen bg-[#DBEBF1]/40">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-6 lg:py-10">
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6">
          <DashboardSidebar locale={locale as RouteLocale} />
          <section className="min-w-0">{children}</section>
        </div>
      </div>
    </main>
  );
}
