// src/app/layout.tsx
import "./globals.css";
import { cookies } from "next/headers";

/**
 * 역할: 앱 최상위 Root Layout.
 * - <html>/<body>는 여기서만 렌더링
 * - locale 쿠키를 읽어서 html lang에 반영
 */
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
