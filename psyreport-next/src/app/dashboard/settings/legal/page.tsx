import Link from "next/link";
import { SettingsShell } from "@/components/SettingsShell";
import { Scale, Cookie, FileText, ShieldCheck, UserCheck, Eye, Trash2, Download } from "lucide-react";
import { getServerT } from "@/lib/i18n-server";

export default async function LegalPage() {
  const { t } = await getServerT();

  const LEGAL_CARDS = [
    {
      href: "/privacy",
      icon: Scale,
      title: t("Política de privacidad"),
      desc: t("Cómo tratamos tus datos personales."),
      cta: t("Leer"),
    },
    {
      href: "/cookies",
      icon: Cookie,
      title: t("Política de cookies"),
      desc: t("Uso de cookies en la plataforma."),
      cta: t("Leer"),
    },
    {
      href: "/dashboard/consents",
      icon: FileText,
      title: t("Términos y condiciones"),
      desc: t("Condiciones de uso del servicio."),
      cta: t("Leer"),
    },
    {
      href: "/dashboard/audit",
      icon: ShieldCheck,
      title: t("RGPD y tus derechos"),
      desc: t("Información sobre tus derechos de protección de datos."),
      cta: t("Leer"),
    },
  ];

  const RIGHTS = [
    { icon: UserCheck, title: t("Acceso"), text: t("Controla quién puede ver tus datos.") },
    { icon: Eye, title: t("Transparencia"), text: t("Sabes qué se hace con tu información.") },
    { icon: Download, title: t("Portabilidad"), text: t("Exporta tus datos cuando quieras.") },
    { icon: Trash2, title: t("Eliminación"), text: t("Borra tu cuenta y datos.") },
  ];

  return (
    <SettingsShell
      title={t("Documentos legales")}
      description={t("Documentación sobre privacidad y tratamiento de datos.")}
      icon={<Scale className="h-7 w-7" />}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {LEGAL_CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="card group flex flex-col gap-4 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
              <card.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-secondary-text">{card.title}</p>
              <p className="mt-1 text-sm text-slate-500">{card.desc}</p>
            </div>
            <span className="mt-auto text-sm font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
              {card.cta} â†’
            </span>
          </Link>
        ))}
      </div>

      <div id="cookies" className="card scroll-mt-24 p-6">
         <h2 className="text-lg font-bold text-secondary-text">{t("¿Qué hacen tus datos?")}</h2>
         <p className="mt-1 text-sm text-slate-500">
           {t("Te explicamos el tratamiento de forma sencilla.")}
         </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {RIGHTS.map((right) => (
            <div key={right.title} className="flex items-start gap-3 rounded-xl border border-secondary-border p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                <right.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-secondary-text">{right.title}</p>
                <p className="mt-0.5 text-sm text-slate-500">{right.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary-light p-4 text-sm font-medium text-primary sm:flex-row sm:items-center sm:justify-between">
           <span>{t("Ver más")}</span>
           <span className="flex flex-wrap gap-4">
             <Link href="/privacy" className="font-bold underline hover:no-underline">{t("Política de privacidad")}</Link>
             <Link href="/cookies" className="font-bold underline hover:no-underline">{t("Política de cookies")}</Link>
           </span>
        </div>
      </div>
    </SettingsShell>
  );
}
