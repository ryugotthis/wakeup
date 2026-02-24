// src/app/[locale]/quiz/page.tsx
import QuizClient from "./QuizClient";

// route locale: ko/en/fr -> data locale 키로 변환
function routeLocaleToDataLocale(locale: string) {
  switch (locale) {
    case "ko":
      return "KO";
    case "en":
      return "EN";
    case "fr":
      return "FR";
    default:
      return "KO";
  }
}

export default async function Page({
  params,
}: {
  // ✅ Next 환경에 따라 params가 Promise로 올 수 있어서 이렇게 받는 게 안전
  params: Promise<{ locale: string }>;
}) {
  // ✅ Promise unwrap
  const { locale: routeLocale } = await params;

  const locale = routeLocaleToDataLocale(routeLocale);

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1>Quiz</h1>
      <QuizClient locale={locale} />
    </main>
  );
}
