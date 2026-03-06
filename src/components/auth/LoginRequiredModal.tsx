"use client";

import { useEffect, useState } from "react";
import type { Locale as RouteLocale } from "@/app/lib/i18n/config";
import ConfirmModal from "@/components/common/ConfirmModal";

type Props = {
  routeLocale: RouteLocale;
};

function t(routeLocale: RouteLocale, ko: string, en: string, fr: string) {
  return routeLocale === "ko" ? ko : routeLocale === "fr" ? fr : en;
}

export default function LoginRequiredModal({ routeLocale }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleOpenLoginModal() {
      setOpen(true);
    }

    window.addEventListener("open-login-required-modal", handleOpenLoginModal);

    return () => {
      window.removeEventListener(
        "open-login-required-modal",
        handleOpenLoginModal,
      );
    };
  }, []);

  function handleConfirm() {
    window.location.href = "/login";
  }

  return (
    <ConfirmModal
      open={open}
      title={t(
        routeLocale,
        "로그인이 필요합니다",
        "Login required",
        "Connexion requise",
      )}
      description={t(
        routeLocale,
        "북마크 기능을 사용하려면 로그인이 필요합니다.",
        "You need to log in to use bookmarks.",
        "Vous devez vous connecter pour utiliser les favoris.",
      )}
      confirmText={t(routeLocale, "로그인하기", "Log in", "Se connecter")}
      cancelText={t(routeLocale, "닫기", "Close", "Fermer")}
      onConfirm={handleConfirm}
      onCancel={() => setOpen(false)}
    />
  );
}
