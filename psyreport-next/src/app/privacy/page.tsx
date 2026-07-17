"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck, Database, Lock, UserCheck, FileText, Scale, Globe, Eye, Trash2, Baby } from "lucide-react";
import { useT } from "@/lib/useT";

export default function PrivacyPolicy() {
  const { t, lang } = useT();
  return (
    <div className="min-h-screen bg-secondary-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> {t("Volver")}
        </Link>

        <div className="card overflow-hidden p-8 md:p-12">
          <div className="mb-10 flex items-center gap-5 border-b border-secondary-border pb-8">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-light">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-secondary-text">{t("Política de privacidad")}</h1>
              <p className="mt-1 font-medium text-slate-500">{t("Te explicamos cómo protegemos y tratamos tus datos personales.")}</p>
              <p className="mt-0.5 text-sm text-slate-400">
                RGPD (UE) 2016/679 · LOPD-GDD 3/2018 · LSSI-CE
              </p>
            </div>
          </div>

          <div className="space-y-9 text-slate-600">
            <Section icon={<UserCheck className="h-6 w-6 text-primary" />} title={t("Responsable del tratamiento")}>
              <p>
                {t("Emotiva PsyReport es la responsable del tratamiento de los datos de los profesionales y pacientes que usan la plataforma.")}
              </p>
            </Section>

            <Section icon={<Database className="h-6 w-6 text-primary" />} title={t("Datos que tratamos")}>
              <p>
                {t("Almacenamos únicamente los datos clínicos necesarios para la atención, cifrados en tránsito y en reposo.")}
              </p>
            </Section>

            <Section icon={<Scale className="h-6 w-6 text-primary" />} title={t("Base legal")}>
              <p>
                {t("El tratamiento se basa en el consentimiento y el cumplimiento de obligaciones legales y deontológicas (RGPD / LOPDGDD).")}
              </p>
            </Section>

            <Section icon={<Lock className="h-6 w-6 text-primary" />} title={t("Seguridad")}>
              <p>
                {t("Tus datos se protegen con cifrado, acceso restringido y registro de auditoría de cada acceso.")}
              </p>
            </Section>

            <Section icon={<FileText className="h-6 w-6 text-primary" />} title={t("Tus derechos")}>
              <p>
                {t("Puedes solicitar el acceso, rectificación, oposición, limitación y supresión de tus datos en cualquier momento.")}
              </p>
            </Section>

            <Section icon={<Globe className="h-6 w-6 text-primary" />} title={t("Portabilidad")}>
              <p>
                {t("Puedes exportar tus datos en formatos estructurados desde la configuración de la cuenta.")}
              </p>
            </Section>

            <Section icon={<ShieldCheck className="h-6 w-6 text-primary" />} title={t("Consentimiento")}>
              <p>
                {t("El consentimiento se recoge de forma informada y puede ser retirado cuando lo desees.")}
              </p>
            </Section>

            <Section icon={<Eye className="h-6 w-6 text-primary" />} title={t("Transparencia")}>
              <p>
                {t("Te informamos de forma clara sobre qué datos usamos y con qué finalidad.")}
              </p>
            </Section>

            <Section icon={<Baby className="h-6 w-6 text-primary" />} title={t("Menores")}>
              <p>
                {t("En el caso de pacientes menores, se requiere el consentimiento de los representantes legales.")}
              </p>
            </Section>

            <Section icon={<Trash2 className="h-6 w-6 text-primary" />} title={t("Supresión de datos")}>
              <p>
                {t("Puedes solicitar la eliminación de tu cuenta y de los datos asociados de forma definitiva.")}
              </p>
            </Section>
          </div>

          <div className="mt-10 flex flex-wrap gap-3 border-t border-secondary-border pt-6">
            <Link href="/cookies" className="btn btn-secondary">{t("Ver política de cookies")}</Link>
            <Link href="/faq" className="btn btn-ghost">{t("Ir a preguntas frecuentes")}</Link>
            <Link href="/dashboard" className="btn btn-primary">{t("Volver al panel")}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="flex gap-4">
      <div className="mt-1 shrink-0">{icon}</div>
      <div>
        <h2 className="text-xl font-bold text-secondary-text">{title}</h2>
        <div className="mt-2 leading-relaxed">{children}</div>
      </div>
    </section>
  );
}
