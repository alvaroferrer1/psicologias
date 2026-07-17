import Link from "next/link";
import { Bell, FileText, KeyRound, Palette, ShieldCheck, UserCog, Scale, Activity } from "lucide-react";
import { translate } from "@/lib/i18n";

const SECTIONS = (t: (k: string) => string) => [
  { href: "/dashboard/settings/account", icon: UserCog, title: t("settings.account"), desc: t("Gestiona tu cuenta y datos."), color: "from-sky-500 to-blue-600", tag: t("Cuenta") },
  { href: "/dashboard/settings/preferences", icon: Palette, title: t("settings.preferences"), desc: t("Ajusta apariencia y avisos."), color: "from-violet-500 to-purple-600", tag: t("Preferencias") },
  { href: "/dashboard/settings/notifications", icon: Bell, title: t("settings.notifications"), desc: t("Avisos de citas y recordatorios."), color: "from-amber-500 to-orange-600", tag: t("Avisos") },
  { href: "/dashboard/settings/sessions", icon: KeyRound, title: t("settings.sessions"), desc: t("Seguridad y accesos."), color: "from-emerald-500 to-teal-600", tag: t("Sesiones") },
  { href: "/dashboard/settings/legal", icon: Scale, title: t("settings.legal"), desc: t("Documentos y privacidad."), color: "from-rose-500 to-pink-600", tag: t("Legal") },
  { href: "/faq", icon: FileText, title: t("settings.faq"), desc: t("Dudas frecuentes."), color: "from-slate-500 to-slate-700", tag: t("FAQ") },
];

export default function SettingsPage() {
  const t = (k: string) => translate("es", k);
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-secondary-text md:text-3xl">{t("settings.title")}</h1>
          <p className="mt-1 font-medium text-slate-500">{t("settings.subtitle")}</p>
        </div>
        <Link href="/dashboard/audit" className="btn btn-secondary inline-flex items-center gap-2">
          <Activity className="h-4 w-4" /> {t("settings.viewAudit")}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS(t).map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="card group relative flex flex-col gap-4 overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
          >
            <span className="absolute right-4 top-4 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:bg-primary-light group-hover:text-primary dark:bg-slate-700 dark:text-slate-300">
              {section.tag}
            </span>
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm transition-transform group-hover:scale-105 ${section.color}`}>
              <section.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-secondary-text">{section.title}</p>
              <p className="mt-1 text-sm text-slate-500">{section.desc}</p>
            </div>
            <span className="mt-auto text-sm font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
              {t("settings.openSection")}
            </span>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary-light p-5 text-sm font-medium text-primary">
          <span className="flex items-center gap-3 text-base font-bold">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            {t("settings.rgpd.title")}
          </span>
          <span className="flex flex-wrap gap-4">
            <Link href="/dashboard/settings/legal" className="font-bold underline hover:no-underline">{t("settings.rgpd.privacy")}</Link>
            <Link href="/dashboard/settings/legal#cookies" className="font-bold underline hover:no-underline">{t("settings.rgpd.cookies")}</Link>
          </span>
        </div>

        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-secondary-border bg-white p-5 text-sm font-medium text-slate-500 dark:bg-[var(--color-secondary-card)]">
          <p className="font-bold text-secondary-text">{t("settings.consents.title")}</p>
          <p className="leading-relaxed">{t("settings.consents.desc")}</p>
          <Link href="/dashboard/consents" className="btn btn-ghost w-fit border-slate-200 text-slate-600 hover:bg-slate-100">
            {t("settings.consents.go")}
          </Link>
        </div>
      </div>
    </div>
  );
}
