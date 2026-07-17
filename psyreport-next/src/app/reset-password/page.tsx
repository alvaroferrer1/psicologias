"use client";

import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";
import { useT } from "@/lib/useT";

export default function ResetPasswordPage() {
  const { t } = useT();
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#edf9f6] via-[#f8fffd] to-[#e5f6f2] p-4">
          <div className="rounded-2xl border border-slate-100 bg-white px-6 py-4 text-sm font-semibold text-slate-500 shadow-xl">
            {t("Cargando...")}
          </div>
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
