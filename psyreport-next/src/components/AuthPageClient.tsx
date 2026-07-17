"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Heart,
  IdCard,
  Info,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Star,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { isValidEmailClient, isValidDniClient, passwordChecks } from "@/lib/validators-client";
import { useT } from "@/lib/useT";

type FieldErrors = Record<string, string>;

function getQueryParam(name: string): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

export default function AuthPageClient() {
  const { t, lang } = useT();
  const locale = lang === "en" ? "en-US" : "es-ES";
  const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL || "demo@psyreport.es";
  const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD || "Demo1234";
  const hasDemoAccess = true;

  const [mode, setMode] = useState<"login" | "register">("login");
  const [isForgot, setIsForgot] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showRegisterPwd, setShowRegisterPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [remember, setRemember] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [dni, setDni] = useState("");
  const [phone, setPhone] = useState("");
  const [colegiado, setColegiado] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", isError: false, devLink: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [blockInfo, setBlockInfo] = useState<{ minutes: number } | null>(null);

  const [registerEmail, setRegisterEmail] = useState("");
  const [invitationToken, setInvitationToken] = useState("");

  const isRegister = mode === "register";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const initialMode = getQueryParam("mode");
    const invite = getQueryParam("invite");
    const inviteEmail = getQueryParam("email");
    const id = requestAnimationFrame(() => {
      if (initialMode === "register") setMode("register");
      if (inviteEmail) setEmail(inviteEmail);
      if (inviteEmail) setRegisterEmail(inviteEmail);
      if (invite) setInvitationToken(invite);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const heading = useMemo(() => {
    if (isForgot) return "¿Olvidaste tu contraseña?";
    return isRegister ? "Crear cuenta" : "Iniciar sesión";
  }, [isForgot, isRegister, t]);

  const clearMessage = () => setMsg({ text: "", isError: false, devLink: "" });

  const passwordFeedback = useMemo(() => passwordChecks(registerPassword), [registerPassword]);
  const confirmMismatch = useMemo(
    () => confirmPassword.length > 0 && confirmPassword !== registerPassword,
    [confirmPassword, registerPassword]
  );

  const postAuth = async (url: string, body: Record<string, unknown>) => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, ...data };
  };

  const validateRegister = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!name.trim()) errors.name = "El nombre es obligatorio.";
    if (!registerEmail.trim()) errors.registerEmail = "El email es obligatorio.";
    else if (!isValidEmailClient(registerEmail)) errors.registerEmail = "Introduce un email válido.";
    if (!dni.trim()) errors.dni = "El DNI es obligatorio.";
    else if (!isValidDniClient(dni)) errors.dni = "Introduce un DNI válido.";
    if (registerPassword.length === 0) errors.registerPassword = "La contraseña es obligatoria.";
    else if (!passwordFeedback.valid) errors.registerPassword = "La contraseña no cumple los requisitos.";
    if (confirmMismatch) errors.confirmPassword = "Las contraseñas no coinciden.";
    if (!acceptTerms) errors.acceptTerms = "Debes aceptar los términos.";
    return errors;
  };

  const validateLogin = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!email.trim()) errors.email = "El email es obligatorio.";
    else if (!isValidEmailClient(email)) errors.email = t("Introduce un email válido.");
    if (!password) errors.password = "La contraseña es obligatoria.";
    return errors;
  };

  const handleDemoAccess = async () => {
    if (!hasDemoAccess) return;

    setMode("login");
    setIsForgot(false);
    clearMessage();
    setFieldErrors({});
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
    setBlockInfo(null);

    if (isRegister) {
      const errors = validateRegister();
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setLoading(false);
        return;
      }
      const res = await postAuth("/api/auth/register", {
        name,
        email: registerEmail,
        dni,
        password: registerPassword,
        phone: phone || undefined,
        colegiado: colegiado || undefined,
        invitationToken,
      });
      if (res.success) {
        try { localStorage.removeItem("emotiva_onboarding_done"); } catch {}
        window.location.assign("/dashboard");
        return;
      }
      setFieldErrors({});
      setMsg({ text: res.error || "No se pudo completar el registro.", isError: true, devLink: "" });
      setLoading(false);
      return;
    }

    if (isForgot) {
      const res = await postAuth("/api/auth/forgot", { email });
      if (res.success) {
        setMsg({ text: res.message || "", isError: false, devLink: res.devLink || "" });
      } else {
        setMsg({ text: res.error || "No se pudo enviar el enlace.", isError: true, devLink: "" });
      }
      setLoading(false);
      return;
    }

    const errors = validateLogin();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    const res = await postAuth("/api/auth/login", {
      email,
      password,
      remember,
    });

    if (res.success) {
      window.location.assign("/dashboard");
      return;
    }

    if (res.blocked) {
      setBlockInfo({ minutes: res.retryAfterMinutes ?? 15 });
    }
    if (res.attemptsLeft !== undefined) {
      setMsg({
        text: (res.error || "Credenciales incorrectas.") + ` Te quedan ${res.attemptsLeft} intento(s).`,
        isError: true,
        devLink: "",
      });
    } else {
      setMsg({ text: res.error || "No se pudo iniciar sesión.", isError: true, devLink: "" });
    }
    setFieldErrors({});
    setLoading(false);
  };

  const switchMode = (next: "login" | "register") => {
    setMode(next);
    setIsForgot(false);
    clearMessage();
    setFieldErrors({});
    setBlockInfo(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="min-h-screen bg-gradient-to-br from-[#eef6ff] via-white to-[#f3fbf8] px-4 py-8 dark:from-[#0b1220] dark:via-[#0b1220] dark:to-[#0e1a2e]"
    >
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl lg:grid-cols-[0.95fr_1.05fr] dark:border-slate-800 dark:bg-[var(--color-secondary-card)]">
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="relative hidden overflow-hidden bg-gradient-to-br from-[#1f5fc7] via-[#477fdc] to-[#6a93e5] p-10 text-white lg:flex lg:flex-col lg:justify-between"
        >
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
                  {"Atención clínica cercana y humana para ti y tu familia."}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Star className="mt-1 h-5 w-5 shrink-0 text-white/80" />
                <p className="text-[15px] font-medium leading-relaxed text-white/90">
                  {"Informes y seguimiento profesional desde un solo lugar."}
                </p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-[14px] font-semibold italic leading-relaxed text-white">
                    &quot;{"El bienestar emocional de tus pacientes, en buenas manos."}&quot;
                  </p>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold">{"Conexión segura cifrada de extremo a extremo."}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                  <Lock className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold">{"Cumplimiento RGPD / LOPDGDD."}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold">{"Acceso solo para profesionales del centro."}</span>
              </div>
            </div>
          </div>

          <p className="relative z-10 text-xs font-medium text-white/70">
            (c) 2026 Centro Psicologico Emotiva - Uso interno del centro
          </p>
        </motion.aside>

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
              {"Centro Psicológico Emotiva"}
            </p>
          </div>

          {!isForgot && (
            <div className="mb-6 inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-bold transition",
                  !isRegister ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {"Iniciar sesión"}
              </button>
              <button
                type="button"
                onClick={() => switchMode("register")}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-bold transition",
                  isRegister ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {"Crear cuenta"}
              </button>
            </div>
          )}

          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tight text-secondary-text">{heading}</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              {isForgot
                ? "Te enviaremos un enlace para restablecer tu contraseña."
                : isRegister
                  ? "Regístrate para empezar a gestionar tus pacientes."
                  : "Accede para continuar a tu panel."}
            </p>
          </div>

          {blockInfo && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
               <p>{"Demasiados intentos. Inténtalo de nuevo en"} {blockInfo.minutes} minuto(s).</p>
            </div>
          )}

          {msg.text && !blockInfo && (
            <div
              className={cn(
                "mb-6 rounded-2xl border p-4 text-sm font-bold",
                msg.isError ? "border-red-200 bg-red-50 text-red-600" : "border-emerald-200 bg-emerald-50 text-emerald-700"
              )}
            >
              <div className="flex items-start gap-2">
                {!msg.isError ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                ) : (
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                )}
                <div>
                  <p>{msg.text}</p>
                  {msg.devLink && (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-white p-3 font-mono text-xs text-slate-700">
                      <p className="mb-1 font-bold text-emerald-800">{"Enlace de desarrollo:"}</p>
                      <a href={msg.devLink} className="break-all text-primary hover:underline">
                        {msg.devLink}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5" noValidate>
            {isRegister ? (
              <>
                <Field
                  label={"Nombre completo"}
                  required
                  icon={<UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
                  error={fieldErrors.name}
                >
                  <input
                    type="text"
                    className={cn("inp pl-10", fieldErrors.name && "error")}
                    placeholder={"Tu nombre"}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </Field>

                <Field
                  label={"Email"}
                  required
                  icon={<Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
                  error={fieldErrors.registerEmail}
                >
                  <input
                    type="email"
                    className={cn("inp pl-10", fieldErrors.registerEmail && "error")}
                    placeholder="nombre@clinica.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    autoComplete="email"
                  />
                </Field>

                <Field
                  label={"DNI"}
                  required
                  icon={<IdCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
                  error={fieldErrors.dni}
                   hint={"Documento de identidad (8 dígitos y letra)."}
                >
                  <input
                    type="text"
                    className={cn("inp pl-10", fieldErrors.dni && "error")}
                    placeholder={"12345678A"}
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    autoComplete="off"
                  />
                </Field>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field
                    label={"Teléfono"}
                    icon={<Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
                  >
                    <input
                      type="tel"
                      className="inp pl-10"
                      placeholder={"+34 600 000 000"}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="tel"
                    />
                  </Field>

                  <Field label={"Colegiado"}>
                    <input
                      type="text"
                      className="inp"
                      placeholder={"COP-0000"}
                      value={colegiado}
                      onChange={(e) => setColegiado(e.target.value)}
                      autoComplete="off"
                    />
                  </Field>
                </div>

                <Field
                  label={"Contraseña"}
                  required
                  icon={<Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
                  error={fieldErrors.registerPassword}
                >
                  <div className="relative">
                    <input
                      type={showRegisterPwd ? "text" : "password"}
                      className={cn("inp pl-10 pr-10", fieldErrors.registerPassword && "error")}
                      placeholder={"Crea una contraseña segura"}
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPwd((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      aria-label={showRegisterPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showRegisterPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {registerPassword.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center gap-2">
                        {[0, 1, 2, 3].map((i) => (
                          <span
                            key={i}
                            className={cn(
                              "h-1.5 flex-1 rounded-full transition-colors",
                              passwordFeedback.score > i
                                ? ["bg-red-400", "bg-amber-400", "bg-yellow-400", "bg-emerald-500"][passwordFeedback.score - 1]
                                : "bg-slate-200"
                            )}
                          />
                        ))}
                        <span className="text-xs font-semibold text-slate-400">
                          {["Débil", "Aceptable", "Buena", "Fuerte"][passwordFeedback.score - 1]}
                        </span>
                      </div>
                      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                        {passwordFeedback.checks.map((c) => (
                          <li
                            key={c.label}
                            className={cn(
                              "flex items-center gap-1.5 text-[11px] font-medium",
                              c.ok ? "text-emerald-600" : "text-slate-400"
                            )}
                          >
                            {c.ok ? <Check className="h-3 w-3" /> : <Info className="h-3 w-3" />}
                            {c.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Field>

                <Field
                  label={"Confirmar contraseña"}
                  required
                  icon={<Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
                  error={fieldErrors.confirmPassword}
                >
                  <div className="relative">
                    <input
                      type={showConfirmPwd ? "text" : "password"}
                      className={cn("inp pl-10 pr-10", fieldErrors.confirmPassword && "error")}
                      placeholder={"Repite la contraseña"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      aria-label={showConfirmPwd ? t("Ocultar contraseña") : t("Mostrar contraseña")}
                    >
                      {showConfirmPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>

                {fieldErrors.acceptTerms && (
                  <p className="text-xs font-semibold text-red-500">{fieldErrors.acceptTerms}</p>
                )}
                <label className="flex items-start gap-2.5 text-sm font-medium text-slate-500">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <span>
                    Acepto la{" "}
                    <Link href="/privacy" className="font-semibold text-primary hover:underline">{"política de privacidad"}</Link>{" "}
                    y la{" "}
                    <Link href="/cookies" className="font-semibold text-primary hover:underline">{"política de cookies"}</Link>.
                  </span>
                </label>
              </>
            ) : (
              <>
                <Field
                  label={"Email"}
                  required
                  icon={<Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
                  error={fieldErrors.email}
                >
                  <input
                    type="email"
                    className={cn("inp pl-10", fieldErrors.email && "error")}
                    placeholder="nombre@clinica.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </Field>

                {!isForgot && (
                  <Field
                  label={"Contraseña"}
                    required
                    icon={<Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
                    error={fieldErrors.password}
                    action={
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgot(true);
                          clearMessage();
                          setFieldErrors({});
                        }}
                        className="text-xs font-semibold text-primary hover:text-primary-dark"
                      >
                        {"¿Olvidaste tu contraseña?"}
                      </button>
                    }
                  >
                    <div className="relative">
                      <input
                        type={showPwd ? "text" : "password"}
                        className={cn("inp pl-10 pr-10", fieldErrors.password && "error")}
                        placeholder="********"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        aria-label={showPwd ? "Ocultar contrasena" : "Mostrar contrasena"}
                      >
                        {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>
                )}

                {!isForgot && (
                  <label className="flex items-center gap-2.5 text-sm font-medium text-slate-500">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <span>{"Recuérdame"}</span>
                  </label>
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
                  {isForgot ? "Enviar enlace" : isRegister ? "Crear cuenta" : "Iniciar sesión"}
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>

            {isForgot && (
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="w-full text-center text-sm font-bold text-slate-500 transition-colors hover:text-slate-800"
              >
                {"Volver a iniciar sesión"}
              </button>
            )}
          </form>

          {hasDemoAccess && !isRegister && (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-extrabold">{"Acceso de demostración"}</p>
                  <p className="mt-1 text-emerald-800">
                    {"Explora la plataforma sin datos reales."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDemoAccess()}
                  className="rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                >
                  {"Entrar en demo"}
                </button>
              </div>
            </div>
          )}

          <p className="mt-6 text-center text-xs text-slate-400">
            Al acceder, aceptas nuestra{" "}
            <Link href="/privacy" className="font-semibold text-primary hover:underline">
              {"política de privacidad"}
            </Link>{" "}
            y{" "}
            <Link href="/cookies" className="font-semibold text-primary hover:underline">
              {"política de cookies"}
            </Link>
            . {"¿Necesitas ayuda?"}{" "}
            <Link href="/faq" className="font-semibold text-primary hover:underline">
              {"Consulta las preguntas frecuentes"}
            </Link>
            .
          </p>
        </section>
      </div>
    </motion.div>
  );
}

function Field({
  label,
  required,
  icon,
  error,
  hint,
  action,
  children,
}: {
  label: string;
  required?: boolean;
  icon?: React.ReactNode;
  error?: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className={cn("lbl", required && "req", "!mb-0")}>{label}</label>
        {action}
      </div>
      <div className="relative">
        {icon}
        {children}
      </div>
      {error ? (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-red-500">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs font-medium text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}
