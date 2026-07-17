"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCcw } from "lucide-react";
import { useT } from "@/lib/useT";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useT();
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary-bg p-6">
      <div className="card w-full max-w-xl p-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-secondary-text">{t("Algo salió mal")}</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          {t("Ha ocurrido un error inesperado. Inténtalo de nuevo.")}
        </p>
        {error?.message && (
          <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-left text-sm text-red-700">
            {error.message}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={reset} className="btn btn-primary">
            <RefreshCcw className="h-4 w-4" /> {t("Reintentar")}
          </button>
          <Link href="/dashboard" className="btn btn-secondary">
            <ArrowLeft className="h-4 w-4" /> {t("Volver al panel")}
          </Link>
        </div>
      </div>
    </div>
  );
}
