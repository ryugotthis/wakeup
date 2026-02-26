// app/[locale]/page.tsx

import Link from "next/link";
import type { Locale } from "@/app/lib/i18n/config";
import { createClient } from "@/app/lib/supabase/server";
import { getDictionary } from "@/app/lib/i18n/getDictionary";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  const dict = await getDictionary(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex flex-col">
      {/* ================= HERO ================= */}
      <section className="relative bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          {/* 슬로건은 3개 언어 모두 영어 고정 */}
          <h1 className="text-5xl leading-tight tracking-tight text-black sm:text-6xl">
            Wake Up Your <span className="font-semibold">Skin</span>,
            <br />
            Empower Your <span className="font-semibold">Glow</span>
          </h1>

          {/* 번역 대상 */}
          <p className="mt-5 max-w-xl text-base leading-relaxed text-black/60">
            {dict.home.description}
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={`/${locale}/quiz`}
              className="group inline-flex items-center justify-center rounded-full bg-black px-8 py-4 text-base font-semibold text-white shadow-md transition hover:scale-[1.02]"
            >
              {dict.home.ctaPrimary}
              <span className="ml-2 transition group-hover:translate-x-1">
                →
              </span>
            </Link>

            <Link
              href={`/${locale}/products`}
              className="rounded-full border border-black/30 px-5 py-2.5 text-sm text-black/70 transition hover:bg-black hover:text-white"
            >
              {dict.home.ctaSecondary}
            </Link>
          </div>

          <p className="mt-1 ml-4 text-xs text-black/60">
            {dict.home.ctaSubtext}
          </p>
        </div>

        {/* 오른쪽 일러스트 자리 (SVG or 이미지 넣기) */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-20">
          {/* 여기에 SVG 얼굴 일러스트 넣으면 됨 */}
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="bg-[#DBEBF1] px-6 py-20">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-medium text-black">
            {dict.home.howTitle}
          </h2>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 items-center">
            {/* 왼쪽 배지 (브랜드 문구는 고정 영어) */}
            <div className="flex justify-center">
              <div className="flex h-40 w-40 items-center justify-center rounded-full border border-black text-center">
                <div>
                  <p className="text-xs tracking-widest">ADD K-BEAUTY</p>
                  <p className="text-5xl font-semibold my-1">W</p>
                  <p className="text-xs tracking-widest">TO YOUR SKIN</p>
                </div>
              </div>
            </div>

            {/* 오른쪽 단계 (번역 대상) */}
            <div className="space-y-5 text-left">
              {dict.home.steps.map((step: string, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-4 rounded-full bg-white px-6 py-3"
                >
                  <span className="text-sm font-medium text-black/60">
                    {`0${index + 1}`}
                  </span>
                  <span className="text-sm font-medium text-black">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER CTA ================= */}
      <section className="bg-white px-6 py-16 text-center">
        {/* 푸터 슬로건도 영어 고정 */}
        <h3 className="text-2xl font-medium text-black">
          Wake Up Your Skin, Empower Your Glow
        </h3>

        <div className="mt-6">
          <Link
            href={`/${locale}/quiz`}
            className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white hover:opacity-90 transition"
          >
            {dict.home.ctaPrimary}
          </Link>
        </div>

        <p className="mt-6 text-xs text-black/50">
          ©2025, WakeUp. All rights reserved
        </p>
      </section>
    </main>
  );
}
