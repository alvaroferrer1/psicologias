"use client";

import { useState } from "react";
import { DownloadCloud, CheckCircle2 } from "lucide-react";
import { updateProfile } from "@/app/actions/profile";
import { cn } from "@/lib/utils";

type SettingsUser = {
  name?: string | null;
  colegiado?: string | null;
  email?: string | null;
};

export default function SettingsForm({ user }: { user?: SettingsUser | null }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", isError: false });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: "", isError: false });

    const formData = new FormData(e.currentTarget);
    const res = await updateProfile(formData);

    if (res.success) {
      setMsg({ text: res.message || "Guardado exitoso.", isError: false });
    } else {
      setMsg({ text: res.error || "Error al guardar.", isError: true });
    }
    setLoading(false);
  };

  return (
    <div className="card relative border-slate-200 bg-white/70 p-6 backdrop-blur-sm">
      <h2 className="mb-6 border-b border-slate-100 pb-4 text-lg font-bold text-secondary-text">Mi Cuenta de Especialista</h2>

      {msg.text && (
        <div className={cn("mb-6 flex items-center gap-2 rounded-xl border p-4 text-sm font-bold", msg.isError ? "border-red-200 bg-red-50 text-red-600" : "border-emerald-200 bg-emerald-50 text-emerald-700")}>
          {!msg.isError && <CheckCircle2 className="h-5 w-5 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">Nombre y Apellidos</label>
            <input name="name" type="text" className="inp bg-slate-50 font-medium text-slate-700" defaultValue={user?.name || "Dr. Demo"} required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">Nº Colegiado</label>
            <input name="colegiado" type="text" className="inp bg-slate-50 font-medium text-slate-700" defaultValue={user?.colegiado || ""} placeholder="Ej: M-12345" />
          </div>
          <div className="col-span-2">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">Email de Acceso (Solo Lectura, Login)</label>
            <input type="email" className="inp cursor-not-allowed bg-slate-50/50 font-medium text-slate-400" defaultValue={user?.email || "correo@correo.com"} disabled />
          </div>
          <div className="col-span-2">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">Firma Escaneada para PDF (Próximamente)</label>
            <div className="flex cursor-not-allowed flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-slate-400 opacity-60">
              <DownloadCloud className="mb-2 h-8 w-8" />
              <p className="text-sm font-bold tracking-tight text-slate-600">Almacenamiento Vercel Blob no configurado aún</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <button type="submit" disabled={loading} className="btn btn-primary min-w-[150px] font-bold shadow-md shadow-primary/20">
            {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
