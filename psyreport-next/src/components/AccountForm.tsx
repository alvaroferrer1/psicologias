"use client";

import Image from "next/image";
import { useState } from "react";
import { CheckCircle2, PenLine, Stamp, UserRound, Briefcase, Phone, MapPin, IdCard, FileText, ShieldAlert, CalendarDays, Sparkles, Activity, CheckCircle, CircleAlert, KeyRound } from "lucide-react";
import { updateProfile } from "@/app/actions/profile";
import { cn } from "@/lib/utils";
import { SettingsShell } from "@/components/SettingsShell";
import { getRoleLabel } from "@/lib/permissions";
import { useT } from "@/lib/useT";

type AccountUser = {
  name?: string | null;
  dni?: string | null;
  colegiado?: string | null;
  phone?: string | null;
  address?: string | null;
  bio?: string | null;
  specialization?: string | null;
  email?: string | null;
  role?: string | null;
  avatarUrl?: string | null;
  signatureDataUrl?: string | null;
  stampDataUrl?: string | null;
  createdAt?: Date | null;
  lockedUntil?: Date | null;
};

type AccountStats = {
  patients: number;
  reports: number;
  appointments: number;
};

export function AccountForm({ user, stats }: { user?: AccountUser | null; stats?: AccountStats }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; isError: boolean }>({ text: "", isError: false });
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [signatureDataUrl, setSignatureDataUrl] = useState(user?.signatureDataUrl || "");
  const [stampDataUrl, setStampDataUrl] = useState(user?.stampDataUrl || "");
  const { t, lang } = useT();
  const locale = lang === "en" ? "en-US" : "es-ES";

  const readImage = (event: React.ChangeEvent<HTMLInputElement>, setter: (value: string) => void, maxBytes = 4 * 1024 * 1024) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setMsg({ text: "Formato no soportado (usa JPG, PNG o WEBP).", isError: true });
      event.target.value = "";
      return;
    }
    if (file.size > maxBytes) {
      setMsg({ text: "El archivo supera el tamaño máximo (4 MB).", isError: true });
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setter(reader.result);
        setMsg({ text: "", isError: false });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: "", isError: false });
    const formData = new FormData(e.currentTarget);
    formData.set("avatarUrl", avatarUrl);
    formData.set("signatureDataUrl", signatureDataUrl);
    formData.set("stampDataUrl", stampDataUrl);
    const res = await updateProfile(formData);
    setMsg(res.success ? { text: res.message || "Perfil actualizado correctamente.", isError: false } : { text: res.error || "No se pudo actualizar el perfil.", isError: true });
    setLoading(false);
  };

  const securityChecks = [
    { label: "DNI verificado", done: Boolean(user?.dni) },
    { label: "Número de colegiado", done: Boolean(user?.colegiado) },
    { label: "Firma subida", done: Boolean(user?.signatureDataUrl) },
    { label: "Sello subido", done: Boolean(user?.stampDataUrl) },
  ];
  const securityScore = securityChecks.filter((c) => c.done).length;

  return (
    <SettingsShell title={"Mi cuenta"} description={"Gestiona tu información profesional y seguridad."} icon={<UserRound className="h-7 w-7" />}>
      {msg.text && (
        <div className={cn("flex items-center gap-2 rounded-xl border p-4 text-sm font-bold", msg.isError ? "border-red-200 bg-red-50 text-red-600" : "border-blue-200 bg-blue-50 text-blue-700")}>
          {!msg.isError && <CheckCircle2 className="h-5 w-5 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Cabecera de perfil */}
      <div className="card relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-white bg-gradient-to-tr from-primary to-primary-dark shadow-md ring-2 ring-primary/20">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Avatar" fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white">
                <UserRound className="h-9 w-9" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-extrabold text-secondary-text">{user?.name || "Sin nombre"}</h2>
              {user?.role && (
                <span className="rounded-full bg-primary-light px-3 py-1 text-[11px] font-black uppercase tracking-wider text-primary">
                  {getRoleLabel(user.role)}
                </span>
              )}
            </div>
            <p className="mt-1 truncate text-sm text-slate-500">{user?.email}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-400">
              {user?.colegiado && (
                <span className="flex items-center gap-1.5"><IdCard className="h-3.5 w-3.5" /> {"Colegiado:"} {user.colegiado}</span>
              )}
              {user?.specialization && (
                <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {user.specialization}</span>
              )}
              {user?.createdAt && (
                <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> {"Alta:"} {new Date(user.createdAt).toLocaleDateString(locale)}</span>
              )}
            </div>
            {user?.lockedUntil && new Date(user.lockedUntil) > new Date() && (
              <p className="mt-2 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
                <ShieldAlert className="h-4 w-4" /> {"Cuenta bloqueada hasta las"} {new Date(user.lockedUntil).toLocaleTimeString(locale)}
              </p>
            )}
          </div>
          <div className="shrink-0">
            <label className="btn btn-secondary cursor-pointer">
              <UserRound className="h-4 w-4" /> {"Cambiar foto"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => readImage(e, setAvatarUrl, 2 * 1024 * 1024)} />
            </label>
            <p className="mt-2 text-center text-xs text-slate-400">{"JPG o PNG, máx. 2 MB"}</p>
          </div>
        </div>
      </div>

      {/* Actividad y seguridad */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <div className="mb-5 flex items-center gap-3 border-b border-secondary-border pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-secondary-text">{"Actividad"}</h3>
              <p className="text-sm text-slate-500">{"Resumen de tu uso en la plataforma."}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-secondary-border bg-slate-50 p-4 text-center dark:bg-slate-800/40">
              <p className="text-2xl font-black text-secondary-text">{stats?.patients ?? 0}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{"Pacientes"}</p>
            </div>
            <div className="rounded-2xl border border-secondary-border bg-slate-50 p-4 text-center dark:bg-slate-800/40">
              <p className="text-2xl font-black text-secondary-text">{stats?.reports ?? 0}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{"Informes"}</p>
            </div>
            <div className="rounded-2xl border border-secondary-border bg-slate-50 p-4 text-center dark:bg-slate-800/40">
              <p className="text-2xl font-black text-secondary-text">{stats?.appointments ?? 0}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{"Citas"}</p>
            </div>
          </div>
            <p className="mt-4 text-sm text-slate-500">
              {"Estos datos se recalculan según tu actividad."}
            </p>
        </section>

        <section className="card p-6">
          <div className="mb-5 flex items-center gap-3 border-b border-secondary-border pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-secondary-text">{"Seguridad"}</h3>
              <p className="text-sm text-slate-500">{"Revisa el estado de tus datos profesionales."}</p>
            </div>
          </div>
          <div className="mb-4 flex items-center gap-3">
            <div className="relative h-12 w-12 shrink-0">
              <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-200 dark:text-slate-700" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${(securityScore / securityChecks.length) * 97.4} 97.4`} className="text-primary" strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-secondary-text">{securityScore}/{securityChecks.length}</span>
            </div>
            <div>
              <p className="font-bold text-secondary-text">{"Tu perfil está "} {securityScore === securityChecks.length ? "completo" : "incompleto"}</p>
              <p className="text-xs text-slate-500">{"Completa tus datos profesionales para mayor confianza."}</p>
            </div>
          </div>
          <ul className="space-y-2">
            {securityChecks.map((check) => (
              <li key={check.label} className="flex items-center gap-2 text-sm">
                {check.done ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                ) : (
                  <CircleAlert className="h-4 w-4 text-amber-500" />
                )}
                <span className={check.done ? "text-slate-600" : "text-slate-400"}>{check.label}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <input type="hidden" name="avatarUrl" value={avatarUrl} />
        <input type="hidden" name="signatureDataUrl" value={signatureDataUrl} />
        <input type="hidden" name="stampDataUrl" value={stampDataUrl} />

        {/* Datos profesionales */}
        <section className="card p-6">
          <div className="mb-5 flex items-center gap-3 border-b border-secondary-border pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-secondary-text">{"Datos profesionales"}</h3>
              <p className="text-sm text-slate-500">{"Nombre, DNI y especialidad."}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">{"Nombre completo"}</label>
              <input name="name" type="text" className="inp bg-slate-50 font-medium text-slate-700" defaultValue={user?.name || ""} required />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">{"DNI"}</label>
              <input name="dni" type="text" className="inp bg-slate-50 font-medium text-slate-700" defaultValue={user?.dni || ""} placeholder="Ej: 12345678A" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">{"Número de colegiado"}</label>
              <input name="colegiado" type="text" className="inp bg-slate-50 font-medium text-slate-700" defaultValue={user?.colegiado || ""} placeholder="COP-0000" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">{"Especialidad"}</label>
              <input name="specialization" type="text" className="inp bg-slate-50 font-medium text-slate-700" defaultValue={user?.specialization || ""} placeholder="Psicologia infantil" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">{"Biografía"}</label>
              <textarea name="bio" rows={3} className="inp resize-none bg-slate-50 font-medium text-slate-700" defaultValue={user?.bio || ""} placeholder="Breve presentacion que puede incluirse en documentos." />
            </div>
          </div>
        </section>

        {/* Contacto */}
        <section className="card p-6">
          <div className="mb-5 flex items-center gap-3 border-b border-secondary-border pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-secondary-text">Contacto</h3>
              <p className="text-sm text-slate-500">Datos de contacto del profesional.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">{"Email"}</label>
              <input type="email" className="inp cursor-not-allowed bg-slate-50/50 font-medium text-slate-400" defaultValue={user?.email || ""} disabled />
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400"><KeyRound className="h-3.5 w-3.5" /> {"El email no se puede cambiar."}</p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">{"Teléfono"}</label>
              <input name="phone" type="tel" className="inp bg-slate-50 font-medium text-slate-700" defaultValue={user?.phone || ""} placeholder="+34 600 000 000" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">{"Dirección"}</label>
              <input name="address" type="text" className="inp bg-slate-50 font-medium text-slate-700" defaultValue={user?.address || ""} placeholder={"Calle, número, ciudad..."} />
            </div>
          </div>
        </section>

        {/* Firma y sello */}
        <section className="card p-6">
          <div className="mb-5 flex items-center gap-3 border-b border-secondary-border pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
              <PenLine className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-secondary-text">{"Firma y sello"}</h3>
              <p className="text-sm text-slate-500">{"Se insertan automáticamente en los PDF que generes."}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700">{"Firma"}</p>
                  <p className="mt-1 text-xs text-slate-500">{"Imagen de tu firma manuscrita."}</p>
                </div>
                <label className="btn btn-secondary cursor-pointer">
                  <PenLine className="h-4 w-4" /> {"Subir firma"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => readImage(e, setSignatureDataUrl)} />
                </label>
              </div>
              {signatureDataUrl && (
                <div className="mt-4 rounded-2xl border border-white bg-white p-4">
                  <p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-400">{"Vista previa de la firma"}</p>
                  <div className="relative h-24 w-full overflow-hidden rounded-xl bg-slate-50">
                    <Image src={signatureDataUrl} alt="Firma" fill className="object-contain p-3" unoptimized />
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/50 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700">{"Sello"}</p>
                  <p className="mt-1 text-xs text-slate-500">{"Imagen de tu sello profesional."}</p>
                </div>
                <label className="btn btn-secondary cursor-pointer">
                  <Stamp className="h-4 w-4" /> {"Subir sello"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => readImage(e, setStampDataUrl)} />
                </label>
              </div>
              {stampDataUrl && (
                <div className="mt-4 rounded-2xl border border-white bg-white p-4">
                  <p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-400">{"Vista previa del sello"}</p>
                  <div className="relative h-24 w-full overflow-hidden rounded-xl bg-slate-50">
                    <Image src={stampDataUrl} alt="Sello" fill className="object-contain p-3" unoptimized />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="border-t border-secondary-border pt-6">
          <button type="submit" disabled={loading} className="btn btn-primary min-w-[150px] font-bold shadow-md shadow-primary/20">
            {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : "Guardar cambios"}
          </button>
        </div>
      </form>
    </SettingsShell>
  );
}
