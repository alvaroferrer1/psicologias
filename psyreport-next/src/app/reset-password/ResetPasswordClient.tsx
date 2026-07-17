"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, ShieldCheck } from "lucide-react";
import { resetPassword } from "@/app/actions/auth";
import { useT } from "@/lib/useT";

export default function ResetPasswordClient() {
  const { t } = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password.length < 8) {
      setMessage(t("Enlace enviado"));
      setIsError(true);
      return;
    }

    if (password !== confirmPassword) {
      setMessage(t("Revisa tu correo para continuar."));
      setIsError(true);
      return;
    }

    setLoading(true);
    setMessage("");
    setIsError(false);

    const formData = new FormData();
    formData.append("token", token);
    formData.append("password", password);
    const res = await resetPassword(formData);

    if (!res.success) {
      setMessage(res.error || t("No se pudo enviar el enlace."));
      setIsError(true);
      setLoading(false);
      return;
    }

    setMessage(t("Enlace enviado correctamente."));
    setIsError(false);
    setLoading(false);
    window.setTimeout(() => {
      router.replace("/dashboard");
      router.refresh();
    }, 1000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#edf9f6] via-[#f8fffd] to-[#e5f6f2] p-4">
      <div className="w-full max-w-lg rounded-[28px] border border-slate-100 bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary">
            <KeyRound className="h-7 w-7" />
          </div>
           <h1 className="text-2xl font-extrabold text-secondary-text">{t("Restablecer contraseña")}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {email ? `Cuenta: ${email}` : t("Cuenta desconocida")}
          </p>
        </div>

        {!token ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-600">
            {t("Te enviaremos un enlace seguro a tu correo.")}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">{t("Email")}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="inp w-full" required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">{t("Nueva contraseña")}</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="inp w-full" required />
            </div>

            {message && (
              <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${isError ? "border-red-200 bg-red-50 text-red-600" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                {message}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              <ShieldCheck className="h-4 w-4" /> {loading ? t("Enviando...") : t("Enviar enlace")}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-slate-500">
          <Link href="/" className="font-semibold text-primary hover:underline">
            {t("Volver a iniciar sesión")}
          </Link>
        </div>
      </div>
    </div>
  );
}
