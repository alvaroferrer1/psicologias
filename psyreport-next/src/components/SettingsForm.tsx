"use client";

import Image from "next/image";
import { useState } from "react";
import { CheckCircle2, PenLine, Stamp } from "lucide-react";
import { updateProfile } from "@/app/actions/profile";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/useT";

type SettingsUser = {
  name?: string | null;
  dni?: string | null;
  email?: string | null;
  signatureDataUrl?: string | null;
  stampDataUrl?: string | null;
};

export default function SettingsForm({ user }: { user?: SettingsUser | null }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", isError: false });
  const [signatureDataUrl, setSignatureDataUrl] = useState(user?.signatureDataUrl || "");
  const [stampDataUrl, setStampDataUrl] = useState(user?.stampDataUrl || "");
  const { t, lang } = useT();
  const locale = lang === "en" ? "en-US" : "es-ES";

  const readImage = (
    event: React.ChangeEvent<HTMLInputElement>,
    setter: (value: string) => void
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSizeBytes = 4 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      setMsg({ text: "Formato no soportado (usa JPG, PNG o WEBP).", isError: true });
      event.target.value = "";
      return;
    }

    if (file.size > maxSizeBytes) {
      setMsg({ text: "El archivo es demasiado grande (máx. 4 MB).", isError: true });
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
    formData.set("signatureDataUrl", signatureDataUrl);
    formData.set("stampDataUrl", stampDataUrl);
    const res = await updateProfile(formData);

    if (res.success) {
      setMsg({ text: res.message || "Datos guardados correctamente.", isError: false });
    } else {
      setMsg({ text: res.error || "No se pudo guardar.", isError: true });
    }
    setLoading(false);
  };

  return (
    <div className="card relative border-slate-200 bg-white/70 p-6 backdrop-blur-sm">
      <h2 className="mb-6 border-b border-slate-100 pb-4 text-lg font-bold text-secondary-text">{"Mi cuenta"}</h2>

      {msg.text && (
        <div className={cn("mb-6 flex items-center gap-2 rounded-xl border p-4 text-sm font-bold", msg.isError ? "border-red-200 bg-red-50 text-red-600" : "border-blue-200 bg-blue-50 text-blue-700")}>
          {!msg.isError && <CheckCircle2 className="h-5 w-5 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative space-y-5">
        <input type="hidden" name="signatureDataUrl" value={signatureDataUrl} />
        <input type="hidden" name="stampDataUrl" value={stampDataUrl} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">{"Nombre"}</label>
            <input name="name" type="text" className="inp bg-slate-50 font-medium text-slate-700" defaultValue={user?.name || ""} required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">{"DNI"}</label>
            <input name="dni" type="text" className="inp bg-slate-50 font-medium text-slate-700" defaultValue={user?.dni || ""} placeholder="Ej: 12345678A" />
          </div>
          <div className="col-span-2">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">{"Email"}</label>
            <input type="email" className="inp cursor-not-allowed bg-slate-50/50 font-medium text-slate-400" defaultValue={user?.email || ""} disabled />
          </div>

          <div className="col-span-2">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">{"Firma"}</label>
            <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700">{"Firma"}</p>
                  <p className="mt-1 text-xs text-slate-500">{"Sube una imagen de tu firma manuscrita."}</p>
                </div>
                <label className="btn btn-secondary cursor-pointer">
                  <PenLine className="h-4 w-4" /> {"Subir firma"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => readImage(e, setSignatureDataUrl)} />
                </label>
              </div>

              {signatureDataUrl && (
                <div className="mt-4 rounded-2xl border border-white bg-white p-4">
                  <p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-400">{"Vista previa"}</p>
                  <div className="relative h-24 w-full overflow-hidden rounded-xl bg-slate-50">
                    <Image src={signatureDataUrl} alt="Firma de la profesional" fill className="object-contain p-3" unoptimized />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-2">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">{"Sello"}</label>
            <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/50 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700">{"Sello"}</p>
                  <p className="mt-1 text-xs text-slate-500">{"Sube una imagen de tu sello profesional."}</p>
                </div>
                <label className="btn btn-secondary cursor-pointer">
                  <Stamp className="h-4 w-4" /> {"Subir sello"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => readImage(e, setStampDataUrl)} />
                </label>
              </div>

              {stampDataUrl && (
                <div className="mt-4 rounded-2xl border border-white bg-white p-4">
                  <p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-400">{t("Vista previa")}</p>
                  <div className="relative h-24 w-full overflow-hidden rounded-xl bg-slate-50">
                    <Image src={stampDataUrl} alt="Sello institucional" fill className="object-contain p-3" unoptimized />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <button type="submit" disabled={loading} className="btn btn-primary min-w-[150px] font-bold shadow-md shadow-primary/20">
            {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
