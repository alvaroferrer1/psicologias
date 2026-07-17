"use client";

import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { useT } from "@/lib/useT";

export default function NotFoundPage() {
  const { t } = useT();
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary-bg p-6">
      <div className="card w-full max-w-xl p-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light text-primary">
          <SearchX className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-secondary-text">{t("Página no encontrada")}</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          {t("La página que buscas no existe o fue movida.")}
        </p>
        <div className="mt-6 flex justify-center">
          <Link href="/dashboard" className="btn btn-primary">
            <ArrowLeft className="h-4 w-4" /> {t("Volver al panel")}
          </Link>
        </div>
      </div>
    </div>
  );
}
