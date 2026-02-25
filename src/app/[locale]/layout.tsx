import { cookies } from "next/headers";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value ?? "en";

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
