"use client";

import { useState, useTransition } from "react";
import { Laptop2, ShieldCheck, Trash2, Smartphone, Monitor, Tablet, Globe, KeyRound, Fingerprint } from "lucide-react";
import { revokeOtherSessions, revokeSessionById } from "@/app/actions/auth";
import { useT } from "@/lib/useT";

type SessionRow = {
  id: string;
  userAgent: string | null;
  ip: string | null;
  lastSeenAt: string;
  expiresAt: string;
  isCurrent: boolean;
};

function parseUserAgent(ua: string | null, t: (k: string) => string) {
  if (!ua) return { device: "Desconocido", icon: Laptop2, os: "Desconocido" };
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(ua);
  const isTablet = /tablet|ipad/i.test(ua);
  let browser = "Navegador";
  if (/edg/i.test(ua)) browser = "Edge";
  else if (/chrome/i.test(ua)) browser = "Chrome";
  else if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";

  let os = t("Desconocido");
  if (/windows/i.test(ua)) os = "Windows";
  else if (/mac os/i.test(ua)) os = "macOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad/i.test(ua)) os = "iPhone/iPad";
  else if (/linux/i.test(ua)) os = "Linux";

  if (isTablet) return { device: `${browser} ${"tablet"}`, icon: Tablet, os };
  if (isMobile) return { device: `${browser} ${"móvil"}`, icon: Smartphone, os };
  return { device: `${browser} ${"escritorio"}`, icon: Monitor, os };
}

export function SessionManager({ sessions }: { sessions: SessionRow[] }) {
  const { t, lang } = useT();
  const locale = lang === "en" ? "en-US" : "es-ES";
  const [items, setItems] = useState(sessions);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleRevoke = (sessionId: string) => {
    startTransition(async () => {
      const res = await revokeSessionById(sessionId);
      if (!res.success) {
        setMessage(res.error || "No se pudo cerrar la sesión.");
        return;
      }

      setItems((prev) => prev.filter((session) => session.id !== sessionId || session.isCurrent));
      setMessage("Sesión cerrada.");
    });
  };

  const handleRevokeOthers = () => {
    startTransition(async () => {
      const res = await revokeOtherSessions();
      if (!res.success) {
        setMessage(res.error || "No se pudieron cerrar las otras sesiones.");
        return;
      }

      setItems((prev) => prev.filter((session) => session.isCurrent));
      setMessage("Otras sesiones cerradas.");
    });
  };

  return (
    <div className="space-y-5">
      {/* Proteccion de la cuenta */}
      <div className="card border-slate-200 bg-white/70 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-light text-primary">
            <Fingerprint className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-secondary-text">{"Protección de la cuenta"}</h2>
            <p className="mt-1 text-sm text-slate-500">{"Cierra sesiones que no reconozcas."}</p>
          </div>
        </div>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          <li className="flex items-start gap-2.5 rounded-xl border border-secondary-border bg-slate-50 p-4 dark:bg-slate-800/40">
            <KeyRound className="mt-0.5 h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-sm font-bold text-secondary-text">{"Contraseña segura"}</p>
              <p className="mt-0.5 text-xs text-slate-500">{"Usa una contraseña única y robusta."}</p>
            </div>
          </li>
          <li className="flex items-start gap-2.5 rounded-xl border border-secondary-border bg-slate-50 p-4 dark:bg-slate-800/40">
            <Globe className="mt-0.5 h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-sm font-bold text-secondary-text">{"Acceso verificado"}</p>
              <p className="mt-0.5 text-xs text-slate-500">{"Inicios de sesión confirmados."}</p>
            </div>
          </li>
          <li className="flex items-start gap-2.5 rounded-xl border border-secondary-border bg-slate-50 p-4 dark:bg-slate-800/40">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-sm font-bold text-secondary-text">{"Cierre de sesión automático"}</p>
              <p className="mt-0.5 text-xs text-slate-500">{"Las sesiones expiran automáticamente."}</p>
            </div>
          </li>
          <li className="flex items-start gap-2.5 rounded-xl border border-secondary-border bg-slate-50 p-4 dark:bg-slate-800/40">
            <Laptop2 className="mt-0.5 h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-sm font-bold text-secondary-text">{items.length} {"sesión"}{items.length === 1 ? "" : "s"} {"activa"}{items.length === 1 ? "" : "s"}</p>
              <p className="mt-0.5 text-xs text-slate-500">{"Esta es la lista de dispositivos con acceso."}</p>
            </div>
          </li>
        </ul>
      </div>

      <div className="card border-slate-200 bg-white/70 p-6 backdrop-blur-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-secondary-text">{"Sesiones activas"}</h2>
            <p className="mt-1 text-sm text-slate-500">{"Revisa y cierra sesiones en otros dispositivos."}</p>
          </div>
          <button type="button" onClick={handleRevokeOthers} disabled={isPending} className="btn btn-secondary">
            <ShieldCheck className="h-4 w-4" /> {"Cerrar otras sesiones"}
          </button>
        </div>

        {message && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        )}

        <div className="mt-5 space-y-3">
          {items.map((session) => {
            const parsed = parseUserAgent(session.userAgent, t);
            const Icon = parsed.icon;
            return (
              <div key={session.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between dark:bg-slate-800/40">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-secondary-text">{parsed.device}</p>
                      {session.isCurrent && (
                        <span className="rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">
                          {"Este dispositivo"}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{"IP:"} {session.ip || "desconocida"} · {parsed.os}</p>
                    <p className="text-xs font-medium text-slate-400">
                      {"Visto"} {session.lastSeenAt} · {"Caduca"} {session.expiresAt}
                    </p>
                  </div>
                </div>
                {!session.isCurrent && (
                  <button type="button" onClick={() => handleRevoke(session.id)} disabled={isPending} className="btn btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700">
                    <Trash2 className="h-4 w-4" /> {"Cerrar sesión"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
