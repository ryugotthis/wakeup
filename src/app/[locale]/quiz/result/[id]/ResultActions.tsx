// src/app/[locale]/quiz/result/[id]/ResultActions.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client"; // ✅ 너 프로젝트 경로에 맞게

type Props = {
  routeLocale: "ko" | "en" | "fr";
  resultId: string;
  isAuthed: boolean;
  shareUrl: string;
  variant: "buttons" | "icons";
};

function t(locale: Props["routeLocale"], ko: string, en: string, fr: string) {
  return locale === "ko" ? ko : locale === "fr" ? fr : en;
}

async function safeCopyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

function IconButton({
  label,
  onClick,
  href,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
}) {
  const base =
    "h-10 w-10 inline-flex items-center justify-center rounded-full border border-black/15 bg-white hover:bg-[#DBEBF1] transition";

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label={label}
        title={label}
        className={base}
      >
        <span className="text-sm font-semibold">{label.slice(0, 1)}</span>
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={base}
    >
      <span className="text-sm font-semibold">{label.slice(0, 1)}</span>
    </button>
  );
}

function ConfirmLoginModal({
  open,
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        aria-label="Close"
      />

      <div className="relative w-full max-w-sm rounded-3xl border border-black/10 bg-white p-6 shadow-xl">
        <h3 className="text-base font-semibold text-black">{title}</h3>
        <p className="mt-2 text-sm text-black/60 whitespace-pre-line">
          {description}
        </p>

        <div className="mt-5 flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-black/15 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-black/5 transition"
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition disabled:opacity-60"
            disabled={loading}
          >
            {loading
              ? t("en", "Loading...", "Loading...", "Loading...")
              : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResultActions({
  routeLocale,
  resultId,
  isAuthed,
  shareUrl,
  variant,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [toast, setToast] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const encodedUrl = useMemo(() => encodeURIComponent(shareUrl), [shareUrl]);

  const facebookShareUrl = useMemo(
    () => `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    [encodedUrl],
  );

  const whatsappShareUrl = useMemo(
    () => `https://wa.me/?text=${encodedUrl}`,
    [encodedUrl],
  );

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1600);
  }

  async function saveToDashboard(id: string) {
    const res = await fetch("/api/results/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resultId: id }),
    });
    if (!res.ok) throw new Error("Save failed");
  }

  async function startGoogleLogin() {
    setIsAuthLoading(true);

    // ✅ 로그인 후 돌아올 페이지(현재 결과 페이지)
    const next = `/${routeLocale}/quiz/result/${resultId}`;

    // ✅ OAuth 완료 후 redirect될 절대 URL이 필요함
    // - NEXT_PUBLIC_SITE_URL 설정 권장
    const origin = window.location.origin;
    const redirectTo = `${origin}${next}?save=1`;

    // ✅ intent 저장 (로그인 후 자동 저장)
    try {
      localStorage.setItem("pendingSaveResultId", resultId);
    } catch {}

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      setIsAuthLoading(false);
      showToast(
        t(
          routeLocale,
          "로그인에 실패했어요.",
          "Login failed.",
          "Échec de connexion.",
        ),
      );
    }
    // 성공이면 브라우저가 리다이렉트됨
  }

  async function onSaveClick() {
    if (isSaving) return;

    if (!isAuthed) {
      setLoginModalOpen(true);
      return;
    }

    setIsSaving(true);
    try {
      await saveToDashboard(resultId);
      showToast(
        t(
          routeLocale,
          "대시보드에 저장했어요!",
          "Saved to dashboard!",
          "Enregistré !",
        ),
      );
    } catch {
      showToast(
        t(routeLocale, "저장에 실패했어요.", "Failed to save.", "Échec."),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function onCopyLink() {
    const ok = await safeCopyToClipboard(shareUrl);
    showToast(
      ok
        ? t(routeLocale, "링크를 복사했어요!", "Link copied!", "Copié !")
        : t(routeLocale, "복사에 실패했어요.", "Copy failed.", "Échec."),
    );
  }

  // ✅ OAuth 후 돌아오면 자동 저장
  useEffect(() => {
    if (!isAuthed) return;

    const saveParam = searchParams?.get("save");
    let pending: string | null = null;

    try {
      pending = localStorage.getItem("pendingSaveResultId");
    } catch {}

    const shouldAutoSave = saveParam === "1" || pending === resultId;
    if (!shouldAutoSave) return;

    (async () => {
      setIsSaving(true);
      try {
        await saveToDashboard(resultId);
        showToast(
          t(
            routeLocale,
            "대시보드에 저장했어요!",
            "Saved to dashboard!",
            "Enregistré !",
          ),
        );
        try {
          localStorage.removeItem("pendingSaveResultId");
        } catch {}
        router.replace(`/${routeLocale}/quiz/result/${resultId}`);
      } catch {
        showToast(
          t(routeLocale, "저장에 실패했어요.", "Failed to save.", "Échec."),
        );
      } finally {
        setIsSaving(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed, resultId]);

  const content =
    variant === "buttons" ? (
      <button
        onClick={onSaveClick}
        disabled={isSaving}
        className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSaving
          ? t(routeLocale, "저장 중...", "Saving...", "Enregistrement...")
          : t(routeLocale, "저장하기", "Save", "Enregistrer")}
      </button>
    ) : (
      <div className="flex items-center gap-2">
        <IconButton
          label={t(routeLocale, "링크 복사", "Copy link", "Copier")}
          onClick={onCopyLink}
        />
        <IconButton label="WhatsApp" href={whatsappShareUrl} />
        <IconButton label="Facebook" href={facebookShareUrl} />
      </div>
    );

  return (
    <>
      {content}

      {/* ✅ 로그인 필요 모달 */}
      <ConfirmLoginModal
        open={loginModalOpen}
        title={t(
          routeLocale,
          "로그인이 필요합니다",
          "Login required",
          "Connexion requise",
        )}
        description={t(
          routeLocale,
          "결과를 저장하려면 Google 로그인(계정)이 필요해요.\n지금 로그인할까요?",
          "You need to log in with Google to save your result.\nContinue now?",
          "Vous devez vous connecter avec Google pour enregistrer.\nContinuer ?",
        )}
        confirmText={t(
          routeLocale,
          "Google로 계속하기",
          "Continue with Google",
          "Continuer avec Google",
        )}
        cancelText={t(routeLocale, "나가기", "Cancel", "Annuler")}
        loading={isAuthLoading}
        onConfirm={async () => {
          // 모달 닫고 OAuth 시작
          setLoginModalOpen(false);
          await startGoogleLogin();
        }}
        onCancel={() => setLoginModalOpen(false)}
      />

      {/* ✅ Toast (항상 표시) */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black px-4 py-2 text-xs font-medium text-white shadow-lg z-50">
          {toast}
        </div>
      )}
    </>
  );
}
