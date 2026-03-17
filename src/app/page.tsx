"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Heart, Lock, Mail, ShieldCheck, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { forgotPassword, loginUser } from "@/app/actions/auth";

export default function AuthPage() {
  const router = useRouter();
  const [isForgot, setIsForgot] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", isError: false, devLink: "" });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: "", isError: false, devLink: "" });

    if (isForgot) {
      const res = await forgotPassword(email);
      if (res.success) {
        setMsg({ text: res.message || "", isError: false, devLink: res.devLink || "" });
      } else {
        setMsg({ text: res.error || "Error", isError: true, devLink: "" });
      }
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    const res = await loginUser(formData);

    if (res.success) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    setMsg({ text: res.error || "Algo salio mal.", isError: true, devLink: "" });
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#edf9f6] via-[#f8fffd] to-[#e5f6f2] p-4">
      <div className="flex w-full max-w-[1020px] flex-col overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-2xl md:flex-row">
        <div className="relative hidden w-full flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0d968b] via-[#11a59a] to-[#0a7a70] p-10 text-white md:flex md:w-[46%]">
          <div className="absolute right-[-60px] top-[-60px] h-[280px] w-[280px] rounded-full bg-[#0b6f67] opacity-35 blur-3xl" />
          <div className="absolute bottom-[-80px] left-[-40px] h-[360px] w-[360px] rounded-full bg-[#0a5f58] opacity-25 blur-3xl" />

          <div className="relative z-10">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/25 bg-white/12 shadow-lg backdrop-blur-sm">
                <Image src="/emotiva-logo.png" alt="PsyReport" width={52} height={52} className="object-contain" priority />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/70">Plataforma clinica</p>
                <h1 className="text-2xl font-black leading-tight tracking-tight">PsyReport</h1>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <Heart className="mt-1 h-5 w-5 shrink-0 text-white/80" />
                <p className="text-[15px] font-medium leading-relaxed text-white/90">
                  Acceso privado para profesionales autorizados del centro.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Star className="mt-1 h-5 w-5 shrink-0 text-white/80" />
                <p className="text-[15px] font-medium leading-relaxed text-white/90">
                  Los expedientes clinicos y la trazabilidad quedan protegidos y vinculados a cada sesion.
                </p>
              </div>
              <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[14px] font-semibold italic leading-relaxed text-white">
                  &quot;Uso exclusivo para personal autorizado.&quot;
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold">Cumplimiento RGPD / LOPDGDD</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                  <Lock className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold">Acceso restringido y auditado</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold">Expedientes clinicos protegidos</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 text-xs font-medium text-white/50">
            (c) 2026 PsyReport - Uso interno del centro
          </div>
        </div>

        <div className="w-full p-8 sm:p-12 md:w-[54%]">
          <div className="mb-8 flex items-center gap-3 md:hidden">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-primary">
              <Image src="/emotiva-logo.png" alt="PsyReport" width={36} height={36} className="object-contain" priority />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-secondary-text">PsyReport</h1>
              <p className="text-xs text-slate-500">Acceso profesional privado</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-secondary-text">
              {isForgot ? "Recuperar acceso" : "Iniciar sesion"}
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {isForgot
                ? "Introduce tu correo corporativo y sigue el proceso seguro de recuperacion."
                : "Accede con una cuenta autorizada por la administracion del centro."}
            </p>
          </div>

          {msg.text && (
            <div
              className={cn(
                "mb-6 flex items-start gap-2 rounded-xl border p-4 text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-200",
                msg.isError ? "border-red-200 bg-red-50 text-red-600" : "border-emerald-200 bg-emerald-50 text-emerald-700",
              )}
            >
              {!msg.isError && <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />}
              <div>
                {msg.text}
                {msg.devLink && (
                  <div className="mt-2 break-all rounded border border-emerald-200 bg-white p-2 font-mono text-xs text-slate-600">
                    <p className="mb-1 font-bold text-emerald-800">LINK DE TEST LOCAL:</p>
                    <a href={msg.devLink} className="text-primary hover:underline">
                      {msg.devLink}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="lbl req">Email profesional</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  className="inp pl-10"
                  placeholder="nombre@clinica.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {!isForgot && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="lbl req !mb-0">Contrasena</label>
                  <button
                    type="button"
                    onClick={() => setIsForgot(true)}
                    className="text-xs font-semibold text-primary hover:text-primary-dark"
                  >
                    Olvidaste la contrasena?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type={showPwd ? "text" : "password"}
                    className="inp pl-10 pr-10"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-full btn-lg relative mt-6 w-full overflow-hidden border-primary bg-gradient-to-r from-primary to-primary-dark shadow-lg hover:border-primary-xdark hover:from-primary-dark hover:to-primary-xdark"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <span className="flex items-center gap-2">
                  {isForgot ? "Continuar recuperacion" : "Acceder a PsyReport"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </button>

            {isForgot && (
              <button
                type="button"
                onClick={() => setIsForgot(false)}
                className="mt-4 w-full text-center text-sm font-bold text-slate-500 transition-colors hover:text-slate-800"
              >
                Volver a iniciar sesion
              </button>
            )}
          </form>

          <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
            El alta de nuevas cuentas esta desactivada. Si necesitas acceso, solicita la creacion de usuario a la administracion del centro.
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            Al acceder, aceptas nuestra{" "}
            <Link href="/privacy" className="font-semibold text-primary hover:underline">
              Politica de Privacidad
            </Link>{" "}
            y{" "}
            <Link href="/cookies" className="font-semibold text-primary hover:underline">
              Politica de Cookies
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
