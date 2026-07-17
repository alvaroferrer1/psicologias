"use client";

import Link from "next/link";
import { ArrowLeft, Cookie, ShieldCheck, AlertTriangle, Settings2, ListChecks, Info, Globe } from "lucide-react";
import { useT } from "@/lib/useT";

const COOKIE_ROWS = [
  {
    name: "psyreport_session",
    type: "Tecnica / Esencial",
    duration: "Sesion + 7 dias",
    purpose: "Mantiene tu sesion autenticada de forma segura (httpOnly, sameSite, cifrada). Sin ella no puedes entrar.",
    provider: "Emotiva PsyReport (propia)",
  },
  {
    name: "emotiva_cookies_accepted",
    type: "Tecnica / Consentimiento",
    duration: "1 anno",
    purpose: "Recuerda tu decision sobre la politica de cookies para no volver a preguntarte.",
    provider: "Emotiva PsyReport (propia)",
  },
  {
    name: "emotiva_prefs",
    type: "Preferencias",
    duration: "1 anno",
    purpose: "Guarda ajustes de interfaz (tema claro/oscuro, modo compacto, privacidad).",
    provider: "Emotiva PsyReport (propia)",
  },
  {
    name: "emotiva_remember",
    type: "Funcional",
    duration: "30 dias",
    purpose: "Permite el acceso recordado en este dispositivo si lo activas al iniciar sesion.",
    provider: "Emotiva PsyReport (propia)",
  },
];

export default function CookiesPolicy() {
  const { t } = useT();
  return (
    <div className="min-h-screen bg-secondary-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> {t("Volver")}
        </Link>

        <div className="card overflow-hidden p-8 md:p-12">
          <div className="mb-10 flex items-center gap-5 border-b border-secondary-border pb-8">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-light">
              <Cookie className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-secondary-text">{t("Política de cookies")}</h1>
              <p className="mt-1 font-medium text-slate-500">{t("Explicamos de forma clara cómo usamos las cookies en PsyReport.")}</p>
              <p className="mt-0.5 text-sm text-slate-400">
                Conforme al Art. 22.2 LSSI-CE, el RGPD (UE) 2016/679 y la Directiva ePrivacy 2009/136/CE
              </p>
            </div>
          </div>

          <div className="space-y-9 text-slate-600">
            <section className="flex gap-4">
              <Cookie className="mt-1 h-6 w-6 shrink-0 text-primary" />
              <div>
                <h2 className="text-xl font-bold text-secondary-text">{t("¿Qué son las cookies?")}</h2>
                <p className="mt-2 leading-relaxed">
                  {t("Las cookies son pequeños archivos que guardamos en tu navegador para recordar tus preferencias y mantener tu sesión segura.")}
                </p>
                <p className="mt-2 leading-relaxed">
                  {t("Tipos de cookies que usamos")}
                </p>
              </div>
            </section>

            <section className="flex gap-4">
              <ListChecks className="mt-1 h-6 w-6 shrink-0 text-primary" />
              <div className="w-full">
                <h2 className="text-xl font-bold text-secondary-text">{t("A continuación detallamos las cookies que utiliza la plataforma, su finalidad y duración.")}</h2>
                <p className="mt-2 leading-relaxed">
                  {t("Cookies técnicas")}
                </p>
                <div className="mt-4 overflow-x-auto rounded-2xl border border-secondary-border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-secondary-bg text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-3">{t("Nombre")}</th>
                        <th className="px-4 py-3">{t("Tipo")}</th>
                        <th className="px-4 py-3">{t("Duración")}</th>
                        <th className="px-4 py-3">{t("Finalidad")}</th>
                        <th className="px-4 py-3">{t("Proveedor")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-border">
                      {COOKIE_ROWS.map((row) => (
                        <tr key={row.name}>
                          <td className="px-4 py-3 font-mono text-xs text-secondary-text">{row.name}</td>
                          <td className="px-4 py-3">{row.type}</td>
                          <td className="px-4 py-3">{row.duration}</td>
                          <td className="px-4 py-3 text-slate-500">{row.purpose}</td>
                          <td className="px-4 py-3 text-slate-500">{row.provider}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary-light p-3 text-sm text-primary">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{t("Puedes gestionar o retirar tu consentimiento en cualquier momento desde la configuración de cookies.")}</p>
                </div>
              </div>
            </section>

            <section className="flex gap-4">
              <Settings2 className="mt-1 h-6 w-6 shrink-0 text-primary" />
              <div>
                <h2 className="text-xl font-bold text-secondary-text">{t("Tus derechos")}</h2>
                <p className="mt-2 leading-relaxed">
                  {t("Tienes control total sobre las cookies no esenciales.")}
                  {" "}
                  <Link href="/dashboard/settings" className="font-semibold text-primary hover:underline">
                    {t("Puedes aceptar, rechazar o configurar las cookies desde el banner o la página de preferencias.")}
                  </Link>
                  . {t("Cambios en esta política")}
                </p>
                <p className="mt-2 leading-relaxed">
                  {t("Si actualizamos esta política, te lo indicaremos en la plataforma.")}
                </p>
              </div>
            </section>

            <section className="flex gap-4">
              <Globe className="mt-1 h-6 w-6 shrink-0 text-primary" />
              <div>
                <h2 className="text-xl font-bold text-secondary-text">{t("Contacto")}</h2>
                <p className="mt-2 leading-relaxed">
                  {t("Para cualquier duda sobre el uso de cookies, contacta con el equipo de soporte.")}
                </p>
              </div>
            </section>

            <section className="flex gap-4">
              <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-primary" />
              <div>
                <h2 className="text-xl font-bold text-secondary-text">{t("Más información")}</h2>
                <p className="mt-2 leading-relaxed">
                  {t("Consulta también nuestra política de privacidad para conocer el tratamiento de tus datos.")}
                </p>
              </div>
            </section>

            <section className="flex gap-4">
              <AlertTriangle className="mt-1 h-6 w-6 shrink-0 text-amber-500" />
              <div>
                <h2 className="text-xl font-bold text-secondary-text">{t("Ver política de privacidad")}</h2>
                <p className="mt-2 leading-relaxed">
                  {t("Volver a la configuración")}
                </p>
              </div>
            </section>
          </div>

          <div className="mt-10 flex flex-wrap gap-3 border-t border-secondary-border pt-6">
            <Link href="/privacy" className="btn btn-secondary">{t("Ir a preguntas frecuentes")}</Link>
            <Link href="/dashboard/settings" className="btn btn-ghost">{t("Ver política de cookies")}</Link>
            <Link href="/faq" className="btn btn-ghost">{t("Ver política de cookies")}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
