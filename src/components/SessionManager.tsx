"use client";

import { useState, useTransition } from "react";
import { Laptop2, ShieldCheck, Trash2 } from "lucide-react";
import { revokeOtherSessions, revokeSessionById } from "@/app/actions/auth";

type SessionRow = {
  id: string;
  userAgent: string | null;
  ip: string | null;
  lastSeenAt: string;
  expiresAt: string;
  isCurrent: boolean;
};

export function SessionManager({ sessions }: { sessions: SessionRow[] }) {
  const [items, setItems] = useState(sessions);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleRevoke = (sessionId: string) => {
    startTransition(async () => {
      const res = await revokeSessionById(sessionId);
      if (!res.success) {
        setMessage(res.error || "No se pudo cerrar la sesion.");
        return;
      }

      setItems((prev) => prev.filter((session) => session.id !== sessionId || session.isCurrent));
      setMessage("Sesion cerrada correctamente.");
    });
  };

  const handleRevokeOthers = () => {
    startTransition(async () => {
      const res = await revokeOtherSessions();
      if (!res.success) {
        setMessage(res.error || "No se pudieron cerrar otras sesiones.");
        return;
      }

      setItems((prev) => prev.filter((session) => session.isCurrent));
      setMessage("Se han cerrado las otras sesiones activas.");
    });
  };

  return (
    <div className="card border-slate-200 bg-white/70 p-6 backdrop-blur-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-secondary-text">Seguridad y sesiones</h2>
          <p className="mt-1 text-sm text-slate-500">Controla desde que dispositivos se ha iniciado sesion.</p>
        </div>
        <button type="button" onClick={handleRevokeOthers} disabled={isPending} className="btn btn-secondary">
          <ShieldCheck className="h-4 w-4" /> Cerrar otras sesiones
        </button>
      </div>

      {message && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      )}

      <div className="mt-5 space-y-3">
        {items.map((session) => (
          <div key={session.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Laptop2 className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-secondary-text">{session.userAgent || "Dispositivo no identificado"}</p>
                  {session.isCurrent && (
                    <span className="rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">
                      Actual
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-500">IP: {session.ip || "No disponible"}</p>
                <p className="text-xs font-medium text-slate-400">
                  Ultima actividad: {session.lastSeenAt} · Expira: {session.expiresAt}
                </p>
              </div>
            </div>
            {!session.isCurrent && (
              <button type="button" onClick={() => handleRevoke(session.id)} disabled={isPending} className="btn btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700">
                <Trash2 className="h-4 w-4" /> Cerrar sesion
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
