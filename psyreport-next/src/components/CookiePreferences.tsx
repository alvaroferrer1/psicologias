"use client";

import { useState } from "react";
import { Cookie, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/useT";

export function CookiePreferences() {
  const { t } = useT();
  const [message, setMessage] = useState("");

  const handleResetBanner = () => {
    localStorage.removeItem("psyreport_cookies_accepted");
    setMessage("El banner de cookies volverá a mostrarse.");
  };

  const handleAcceptNow = () => {
    localStorage.setItem("psyreport_cookies_accepted", "true");
    setMessage("Preferencias de cookies guardadas.");
  };

  return (
    <div className="card border-slate-200 bg-white/70 p-6 backdrop-blur-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-light text-primary">
          <Cookie className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-secondary-text">{"Preferencias de cookies"}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {"Gestiona el consentimiento de cookies en cualquier momento."}
          </p>
        </div>
      </div>

      {message && (
        <div className={cn("mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700")}>
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={handleAcceptNow} className="btn btn-primary">
            {"Aceptar cookies"}
          </button>
          <button type="button" onClick={handleResetBanner} className="btn btn-secondary">
            {"Mostrar banner"}
          </button>
          <a href="/cookies" className="btn btn-ghost border-slate-200 text-slate-600 hover:bg-slate-100">
            {"Política de cookies"}
          </a>
          <a href="/privacy" className="btn btn-ghost border-slate-200 text-slate-600 hover:bg-slate-100">
            {"Política de privacidad"}
          </a>
      </div>
    </div>
  );
}
