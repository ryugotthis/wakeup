// src/app/layout.tsx
import "./globals.css";
import { cookies } from "next/headers";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://wakeup-nine.vercel.app"),

  title: {
    default: "WakeUp | Discover Your Skin Type",
    template: "%s | WakeUp",
  },

  description:
    "Find your skin type and get personalized skincare recommendations.",

  applicationName: "WakeUp",
  keywords: [
    "WakeUp",
    "skin type test",
    "skincare",
    "personalized skincare",
    "K-beauty",
  ],
  authors: [{ name: "WakeUp" }],
  creator: "WakeUp",
  publisher: "WakeUp",
  category: "beauty",
  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    title: "WakeUp | Discover Your Skin Type",
    description:
      "Find your skin type and get personalized skincare recommendations.",
    siteName: "WakeUp",
    images: [
      {
        url: "/icon.png", // 👉 아이콘 그대로 사용 (좋은 선택)
        width: 512,
        height: 512,
        alt: "WakeUp",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "WakeUp | Discover Your Skin Type",
    description:
      "Find your skin type and get personalized skincare recommendations.",
    images: ["/icon.png"], // 👉 동일하게 사용
  },

  robots: {
    index: true,
    follow: true,
  },
};

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
