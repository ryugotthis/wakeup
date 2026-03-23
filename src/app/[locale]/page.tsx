// app/[locale]/page.tsx

import Link from "next/link";
import type { Locale } from "@/app/lib/i18n/config";
import { getDictionary } from "@/app/lib/i18n/getDictionary";
import Image from "next/image";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  const dict = await getDictionary(locale);

  return (
    <main className="flex flex-col">
      {/* ================= HERO ================= */}
      <section className="relative z-0 bg-white px-6 py-20">
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
              className="rounded-full border border-black/30 px-5 py-2.5 text-center text-sm text-black/70 transition hover:bg-black hover:text-white"
            >
              {dict.home.ctaSecondary}
            </Link>
          </div>
          <div className="flex items-stretch">
            <p className="mt-1 sm:ml-4 text-base tracking-tighter text-black/60">
              {dict.home.ctaSubtext}
            </p>
            <ul className="mt-1 ml-2 w-3 flex gap-0.5">
              <li className="relative h-6 w-6 shrink-0">
                <Image
                  src="/images/brand/wakeup-skin-ds-icon.png"
                  alt="WakeUp Hero Face"
                  fill
                  className="object-contain"
                />
              </li>
              <li className="relative h-6 w-6 shrink-0">
                <Image
                  src="/images/brand/wakeup-skin-ob-icon.png"
                  alt="WakeUp Hero Face"
                  fill
                  className="object-contain"
                />
              </li>
              <li className="relative h-6 w-6 shrink-0">
                <Image
                  src="/images/brand/wakeup-skin-sc-icon.png"
                  alt="WakeUp Hero Face"
                  fill
                  className="object-contain"
                />
              </li>
              <li className="relative h-6 w-6 shrink-0">
                <Image
                  src="/images/brand/wakeup-skin-hs-icon.png"
                  alt="WakeUp Hero Face"
                  fill
                  className="object-contain"
                />
              </li>
              <li className="relative h-6 w-6 shrink-0">
                <Image
                  src="/images/brand/wakeup-skin-cc-icon.png"
                  alt="WakeUp Hero Face"
                  fill
                  className="object-contain"
                />
              </li>
            </ul>
          </div>
        </div>

        {/* 오른쪽 일러스트 자리 (SVG or 이미지 넣기) */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 -z-10">
          {/* 여기에 SVG 얼굴 일러스트 넣으면 됨 */}
          <Image
            src="/images/brand/wakeup-hero-illustration.png"
            alt="WakeUp Hero Face"
            fill
            className="object-contain "
          />
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="bg-[#DBEBF1] px-6 py-20">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-medium text-black">
            {dict.home.howTitle}
          </h2>

          <div className="mt-14 grid sm:grid-cols-2 items-center">
            {/* 왼쪽 배지 (브랜드 문구는 고정 영어) */}
            <div className="relative w-full h-full ">
              <Image
                src="/images/brand/wakeup-badge.png"
                alt="WakeUp logo"
                fill
                className="absolute object-contain"
              />
            </div>

            {/* 오른쪽 단계 (번역 대상) */}
            <div className="flex w-full flex-col items-center sm:items-stretch gap-6 text-left sm:gap-7 lg:gap-8">
              {dict.home.steps.map((step: string, index: number) => {
                const offsets = ["lg:ml-0", "lg:ml-12", "lg:ml-8", "lg:ml-2"];

                const numberPositions = [
                  "left-2 -top-5 sm:-top-6 lg:left-2 lg:-top-7",
                  "right-3 -top-5 sm:right-28 sm:-top-6 lg:right-34 lg:-top-7",
                  "right-3 -top-5 sm:right-28 sm:-top-6 lg:right-37 lg:-top-7",
                  "left-2 -top-5 sm:-top-6 lg:left-2 lg:-top-7",
                ];

                return (
                  <div
                    key={index}
                    className={`relative ${offsets[index] ?? "lg:ml-0"}`}
                  >
                    <span
                      className={`absolute ${numberPositions[index] ?? "left-2 -top-5"} text-3xl font-light tracking-tight text-black/35 sm:text-4xl lg:text-5xl`}
                    >
                      {`0${index + 1}`}
                    </span>

                    <div className="flex min-h-[56px] w-80 sm:w-full max-w-[260px] items-center justify-center rounded-full bg-white px-5 py-3 text-center shadow-sm sm:min-h-[64px] sm:max-w-[300px] sm:px-6 lg:min-h-[72px] lg:max-w-[340px] lg:px-8">
                      <span className="text-sm font-medium text-black sm:text-base lg:text-lg">
                        {step}
                      </span>
                    </div>
                  </div>
                );
              })}
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
