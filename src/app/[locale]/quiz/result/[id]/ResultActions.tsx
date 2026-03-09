"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";
import ConfirmModal from "@/components/common/ConfirmModal";
import {
  buildAuthReturnUrl,
  clearAuthResumeState,
  shouldResumeAfterLogin,
} from "@/app/lib/auth/authActionResume";

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

export default function ResultActions({
  routeLocale,
  resultId,
  isAuthed,
  shareUrl,
  variant,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
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

    const origin = window.location.origin;
    const redirectTo = buildAuthReturnUrl({
      origin,
      pathname,
      search: searchParams.toString(),
      actionParamKey: "save",
      actionParamValue: "1",
    });

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

  /**
   * 역할:
   * OAuth 로그인 후 현재 결과 페이지로 다시 돌아왔을 때
   * 로그인 전에 시도했던 "결과 저장" 액션을 자동으로 재실행한다.
   */
  useEffect(() => {
    if (!isAuthed) return;

    const shouldAutoSave = shouldResumeAfterLogin({
      search: searchParams.toString(),
      actionParamKey: "save",
      actionParamValue: "1",
      storageKey: "pendingSaveResultId",
      storageValue: resultId,
    });

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

        const cleanedUrl = clearAuthResumeState({
          pathname,
          search: searchParams.toString(),
          queryKeysToRemove: ["save"],
          storageKeysToRemove: ["pendingSaveResultId"],
        });

        router.replace(cleanedUrl);
      } catch {
        showToast(
          t(routeLocale, "저장에 실패했어요.", "Failed to save.", "Échec."),
        );
      } finally {
        setIsSaving(false);
      }
    })();
  }, [isAuthed, pathname, resultId, routeLocale, router, searchParams]);

  const content =
    variant === "buttons" ? (
      <button
        onClick={onSaveClick}
        disabled={isSaving}
        className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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

      <ConfirmModal
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
          setLoginModalOpen(false);
          await startGoogleLogin();
        }}
        onCancel={() => setLoginModalOpen(false)}
      />

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black px-4 py-2 text-xs font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}
