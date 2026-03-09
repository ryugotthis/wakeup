"use client";

import type { Locale as RouteLocale } from "@/app/lib/i18n/config";
import ConfirmModal from "@/components/common/ConfirmModal";

type Props = {
  routeLocale: RouteLocale;
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
};

function t(routeLocale: RouteLocale, ko: string, en: string, fr: string) {
  return routeLocale === "ko" ? ko : routeLocale === "fr" ? fr : en;
}

export default function LoginRequiredModal({
  routeLocale,
  open,
  onConfirm,
  onCancel,
  loading = false,
  title,
  description,
  confirmText,
  cancelText,
}: Props) {
  return (
    <ConfirmModal
      open={open}
      title={
        title ??
        t(
          routeLocale,
          "로그인이 필요합니다",
          "Login required",
          "Connexion requise",
        )
      }
      description={
        description ??
        t(
          routeLocale,
          "이 기능을 사용하려면 Google 로그인(계정)이 필요합니다.",
          "You need to log in with Google to use this feature.",
          "Vous devez vous connecter avec Google pour utiliser cette fonctionnalité.",
        )
      }
      confirmText={
        confirmText ??
        t(
          routeLocale,
          "Google로 계속하기",
          "Continue with Google",
          "Continuer avec Google",
        )
      }
      cancelText={cancelText ?? t(routeLocale, "닫기", "Close", "Fermer")}
      onConfirm={onConfirm}
      onCancel={onCancel}
      loading={loading}
    />
  );
}
