// src/app/[locale]/quiz/result/[id]/ResultActions.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

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
  const searchParams = useSearchParams();

  const [toast, setToast] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const encodedUrl = useMemo(() => encodeURIComponent(shareUrl), [shareUrl]);

  const facebookShareUrl = useMemo(
    () => `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    [encodedUrl],
  );

  const whatsappShareUrl = useMemo(
    () => `https://wa.me/?text=${encodedUrl}`,
    [encodedUrl],
  );

  // 트위터(X) 버전도 가능:
  // const xShareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}`;

  const loginUrl = useMemo(() => {
    const next = `/${routeLocale}/quiz/result/${resultId}`;
    return `/${routeLocale}/login?next=${encodeURIComponent(next)}&save=1`;
  }, [routeLocale, resultId]);

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

  async function onSaveClick() {
    if (isSaving) return;

    if (!isAuthed) {
      try {
        localStorage.setItem("pendingSaveResultId", resultId);
      } catch {}
      showToast(
        t(
          routeLocale,
          "저장하려면 로그인해 주세요.",
          "Log in to save.",
          "Connectez-vous pour enregistrer.",
        ),
      );
      router.push(loginUrl);
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
    if (ok) {
      showToast(
        t(routeLocale, "링크를 복사했어요!", "Link copied!", "Copié !"),
      );
    } else {
      showToast(t(routeLocale, "복사에 실패했어요.", "Copy failed.", "Échec."));
    }
  }

  // 로그인/회원가입 후 자동 저장
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

  if (variant === "buttons") {
    return (
      <>
        <button
          onClick={onSaveClick}
          disabled={isSaving}
          className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSaving
            ? t(routeLocale, "저장 중...", "Saving...", "Enregistrement...")
            : t(routeLocale, "저장하기", "Save", "Enregistrer")}
        </button>

        {!isAuthed && (
          <span className="hidden sm:inline text-xs text-black/40">
            {t(
              routeLocale,
              "로그인 필요",
              "Login required",
              "Connexion requise",
            )}
          </span>
        )}
      </>
    );
  }

  // variant === "icons"
  return (
    <div className="flex items-center gap-2">
      <IconButton
        label={t(routeLocale, "링크 복사", "Copy link", "Copier")}
        onClick={onCopyLink}
      />
      <IconButton label="WhatsApp" href={whatsappShareUrl} />
      <IconButton label="Facebook" href={facebookShareUrl} />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black px-4 py-2 text-xs font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
