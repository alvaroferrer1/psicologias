"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Heart,
  IdCard,
  Lock,
  Mail,
  ShieldCheck,
  Star,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AuthPageClient() {
  const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL || "demo@psyreport.es";
  const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD || "Demo1234";
  const hasDemoAccess = true;

  const [mode, setMode] = useState<"login" | "register">("login");
  const [isForgot, setIsForgot] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showRegisterPwd, setShowRegisterPwd] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerDni, setRegisterDni] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", isError: false, devLink: "" });

  const isRegister = mode === "register";

  const heading = useMemo(() => {
    if (isForgot) return "Recuperar acceso";
    return isRegister ? "Crear cuenta" : "Iniciar sesion";
  }, [isForgot, isRegister]);

  const clearMessage = () => setMsg({ text: "", isError: false, devLink: "" });

  const postAuth = async (url: string, body: Record<string, string>) => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    return {
      ok: response.ok,
      ...data,
    };
  };

  const handleDemoAccess = async () => {
    if (!hasDemoAccess) return;

    setMode("login");
    setIsForgot(false);
    clearMessage();
    setLoading(true);

    const res = await postAuth("/api/auth/demo", {});

    if (res.success) {
      window.location.assign("/dashboard");
      return;
    }

    setMsg({ text: res.error || "No se pudo acceder con la demo.", isError: true, devLink: "" });
    setLoading(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessage();

    if (isRegister) {
      const res = await postAuth("/api/auth/register", {
        name: registerName,
        email: registerEmail,
        dni: registerDni,
        password: registerPassword,
      });
      if (res.success) {
        window.location.assign("/dashboard");
        return;
      }

      setMsg({ text: res.error || "No se pudo crear la cuenta.", isError: true, devLink: "" });
      setLoading(false);
      return;
    }

    if (isForgot) {
      const res = await postAuth("/api/auth/forgot", { email });
      if (res.success) {
        setMsg({ text: res.message || "", isError: false, devLink: res.devLink || "" });
      } else {
        setMsg({ text: res.error || "No se pudo recuperar el acceso.", isError: true, devLink: "" });
      }
      setLoading(false);
      return;
    }

    const res = await postAuth("/api/auth/login", {
      email,
      password,
    });

    if (res.success) {
      window.location.assign("/dashboard");
      return;
    }

    setMsg({ text: res.error || "No se pudo iniciar sesion.", isError: true, devLink: "" });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef6ff] via-white to-[#f3fbf8] px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#1f5fc7] via-[#477fdc] to-[#6a93e5] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.14),transparent_30%)]" />
          <div className="relative z-10">
            <div className="overflow-hidden rounded-[28px] border border-white/20 bg-white/10 p-4 shadow-xl backdrop-blur-sm">
              <Image
                src="/emotiva-auth-logo.jpeg"
                alt="Centro Psicologico Emotiva"
                width={560}
                height={560}
                className="h-auto w-full rounded-[20px] object-cover"
                priority
              />
            </div>

            <div className="mt-8 space-y-5">
              <div className="flex items-start gap-3">
                <Heart className="mt-1 h-5 w-5 shrink-0 text-white/80" />
                <p className="text-[15px] font-medium leading-relaxed text-white/90">
                  Espacio privado para la gestion clinica y documental del centro.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Star className="mt-1 h-5 w-5 shrink-0 text-white/80" />
                <p className="text-[15px] font-medium leading-relaxed text-white/90">
                  El historial, los informes y las sesiones quedan organizados y vinculados a cada paciente.
                </p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[14px] font-semibold italic leading-relaxed text-white">
                  &quot;Uso exclusivo para el equipo profesional del centro.&quot;
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
                <span className="text-sm font-semibold">Acceso seguro y protegido</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold">Expedientes clinicos organizados</span>
              </div>
            </div>
          </div>

          <p className="relative z-10 text-xs font-medium text-white/70">
            (c) 2026 Centro Psicologico Emotiva - Uso interno del centro
          </p>
        </aside>

        <section className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
          <div className="mb-8 lg:hidden">
            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50 p-3 shadow-sm">
              <Image
                src="/emotiva-auth-logo.jpeg"
                alt="Centro Psicologico Emotiva"
                width={560}
                height={560}
                className="h-auto w-full rounded-[18px] object-cover"
                priority
              />
            </div>
            <p className="mt-3 text-center text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Acceso profesional privado
            </p>
          </div>

          {!isForgot && (
            <div className="mb-6 inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  clearMessage();
                }}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-bold transition",
                  !isRegister ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Iniciar sesion
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  clearMessage();
                }}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-bold transition",
                  isRegister ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Registrarse
              </button>
            </div>
          )}

          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tight text-secondary-text">{heading}</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              {isForgot
                ? "Introduce tu correo y sigue el proceso seguro de recuperacion."
                : isRegister
                  ? "Crea tu cuenta profesional para entrar al panel."
                  : "Accede con tu correo y tu contrasena para entrar al panel clinico."}
            </p>
          </div>

          {msg.text && (
            <div
              className={cn(
                "mb-6 rounded-2xl border p-4 text-sm font-bold",
                msg.isError ? "border-red-200 bg-red-50 text-red-600" : "border-emerald-200 bg-emerald-50 text-emerald-700"
              )}
            >
              <div className="flex items-start gap-2">
                {!msg.isError && <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />}
                <div>
                  <p>{msg.text}</p>
                  {msg.devLink && (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-white p-3 font-mono text-xs text-slate-700">
                      <p className="mb-1 font-bold text-emerald-800">LINK DE TEST LOCAL</p>
                      <a href={msg.devLink} className="break-all text-primary hover:underline">
                        {msg.devLink}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            {isRegister ? (
              <>
                <div>
                  <label className="lbl req">Nombre y apellidos</label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      className="inp pl-10"
                      placeholder="Nombre completo"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="lbl req">Email profesional</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      className="inp pl-10"
                      placeholder="nombre@clinica.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="lbl req">DNI profesional</label>
                  <div className="relative">
                    <IdCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      className="inp pl-10"
                      placeholder="12345678A"
                      value={registerDni}
                      onChange={(e) => setRegisterDni(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="lbl req">Contrasena</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showRegisterPwd ? "text" : "password"}
                      className="inp pl-10 pr-10"
                      placeholder="Minimo 10 caracteres, mayuscula, numero y simbolo"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPwd((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showRegisterPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="lbl req">Email profesional</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
                        onClick={() => setShowPwd((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg mt-2 w-full border-primary bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary-xdark"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <span className="flex items-center gap-2">
                  {isForgot ? "Continuar recuperacion" : isRegister ? "Crear cuenta y entrar" : "Acceder a PsyReport"}
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>

            {isForgot && (
              <button
                type="button"
                onClick={() => setIsForgot(false)}
                className="w-full text-center text-sm font-bold text-slate-500 transition-colors hover:text-slate-800"
              >
                Volver a iniciar sesion
              </button>
            )}
          </form>

          {hasDemoAccess && (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-extrabold">Acceso demo disponible</p>
                  <p className="mt-1 text-emerald-800">
                    Puedes entrar con el usuario de prueba configurado para demostraciones.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDemoAccess()}
                  className="rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                >
                  Usar acceso demo
                </button>
              </div>
            </div>
          )}

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
        </section>
      </div>
    </div>
  );
}
