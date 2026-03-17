"use client";

import { useState } from "react";
import { Cookie, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function CookiePreferences() {
  const [message, setMessage] = useState("");

  const handleResetBanner = () => {
    localStorage.removeItem("psyreport_cookies_accepted");
    setMessage("El aviso de cookies volverá a mostrarse en la próxima carga.");
  };

  const handleAcceptNow = () => {
    localStorage.setItem("psyreport_cookies_accepted", "true");
    setMessage("Preferencia de cookies guardada correctamente.");
  };

  return (
    <div className="card border-slate-200 bg-white/70 p-6 backdrop-blur-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-light text-primary">
          <Cookie className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-secondary-text">Privacidad y Cookies</h2>
          <p className="mt-1 text-sm text-slate-500">
            Gestiona el banner legal y accede rápido a la documentación de privacidad.
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
          Guardar aceptación
        </button>
        <button type="button" onClick={handleResetBanner} className="btn btn-secondary">
          Volver a mostrar banner
        </button>
        <a href="/cookies" className="btn btn-ghost border-slate-200 text-slate-600 hover:bg-slate-100">
          Política de Cookies
        </a>
        <a href="/privacy" className="btn btn-ghost border-slate-200 text-slate-600 hover:bg-slate-100">
          Política de Privacidad
        </a>
      </div>
    </div>
  );
}
