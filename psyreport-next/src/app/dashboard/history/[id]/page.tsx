import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit3 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { AutoDownloadPdf } from "@/components/AutoDownloadPdf";
import { ReportPdfButton } from "@/components/ReportPdfButton";
import { ReportStatusSelector } from "@/components/ReportStatusSelector";
import { getReportFieldValue, hasReportFieldValue, parseStoredReportContent, type ReportFieldValue } from "@/lib/report-content";
import { getServerT } from "@/lib/i18n-server";
import {
  EMOTIVA_LEGAL_NOTICE,
  getPatientCategoryLabel,
  getPdfDocumentHeading,
  getReportKindLabel,
  getReportSections,
  type PatientCategory,
  type ReportFieldDefinition,
  type ReportKind,
} from "@/lib/report-templates";

function normalizeCategory(value?: string | null): PatientCategory {
  if (value === "infantil" || value === "adolescente" || value === "pareja" || value === "familia") return value;
  return "adulto";
}

function normalizeKind(value?: string | null): ReportKind {
  if (value === "historia_clinica" || value === "registro") return value;
  return "informe";
}

function renderFieldValue(field: ReportFieldDefinition, value: ReportFieldValue) {
  if (!hasReportFieldValue(value)) return null;
  if (field.type === "image" && typeof value === "string") {
    return <img src={value} alt={field.label} className="max-h-64 w-auto rounded-xl object-contain" />;
  }
  return <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-700">{String(value)}</p>;
}

function getPdfCategoryDescriptor(category: PatientCategory, t: (k: string) => string) {
  switch (category) {
    case "infantil":
      return t("report.cat.child");
    case "adolescente":
      return t("report.cat.teen");
    case "pareja":
      return t("report.cat.couple");
    case "familia":
      return t("report.cat.family");
    case "adulto":
    default:
      return t("report.cat.adult");
  }
}

function getPdfKindDescriptor(kind: ReportKind, t: (k: string) => string) {
  if (kind === "historia_clinica") return t("report.kind.clinical");
  if (kind === "registro") return t("report.kind.record");
  return t("report.kind.report");
}

function getPdfCoverTitle(kind: ReportKind, category: PatientCategory, t: (k: string) => string) {
  return `${getPdfKindDescriptor(kind, t)} ${getPdfCategoryDescriptor(category, t)}`;
}

function renderPdfExportFieldValue(field: ReportFieldDefinition, value: ReportFieldValue) {
  if (!hasReportFieldValue(value)) return null;
  if (field.type === "image" && typeof value === "string") {
    return <img src={value} alt={field.label} className="mt-4 max-h-52 w-auto rounded-2xl object-contain" />;
  }

  return (
    <div className="mt-3 rounded-[20px] border border-slate-200 bg-slate-50 px-5 py-4">
      <p className="whitespace-pre-wrap text-[14px] font-medium leading-7 text-slate-700">{String(value)}</p>
    </div>
  );
}

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t, lang } = await getServerT();
  const locale = lang === "en" ? "en-US" : "es-ES";
  const user = await requireCurrentUser();
  const { id } = await params;

  const report = await prisma.report.findFirst({
    where: {
      id,
      deletedAt: null,
      OR: [{ userId: user.id }, { userId: null }],
    },
    include: {
      user: {
        select: {
          name: true,
          dni: true,
          signatureDataUrl: true,
          stampDataUrl: true,
        },
      },
      patient: true,
      versions: {
        orderBy: { version: "desc" },
        take: 5,
      },
    },
  });

  if (!report) notFound();

  const parsed = parseStoredReportContent(report.content);
  const reportKind = normalizeKind((report as { reportKind?: string }).reportKind || parsed.meta?.kind || "informe");
  const patientCategory = normalizeCategory((report as { patientCategory?: string }).patientCategory || parsed.meta?.category || report.type || "adulto");
  const sections = getReportSections(reportKind, patientCategory);
  const fields = parsed.fields || {};
  const resolvedSignatureName =
    (typeof getReportFieldValue(fields, "signature_name") === "string" && String(getReportFieldValue(fields, "signature_name"))) ||
    report.user?.name ||
    "";
  const resolvedSignatureImage =
    (typeof getReportFieldValue(fields, "signature_image") === "string" && String(getReportFieldValue(fields, "signature_image"))) ||
    report.user?.signatureDataUrl ||
    "";
  const resolvedStampImage =
    (typeof getReportFieldValue(fields, "institution_stamp_image") === "string" && String(getReportFieldValue(fields, "institution_stamp_image"))) ||
    report.user?.stampDataUrl ||
    "";
  const pdfFilename = `documento_${report.patient?.name?.replace(/\s+/g, "_") || "sin_paciente"}_${report.id.slice(0, 8)}.pdf`;
  const heading = getPdfDocumentHeading(reportKind);
  const pdfCoverTitle = getPdfCoverTitle(reportKind, patientCategory, t);
  const patientLabel = report.patient?.name || t("Paciente sin asignar");
  const pdfSections = sections
    .map((section) => ({
      title: section.title,
      description: section.description,
      fields: section.fields
        .filter((field) => {
          const value = getReportFieldValue(fields, field.key);
          return hasReportFieldValue(value);
        })
        .map((field) => {
          const rawValue = getReportFieldValue(fields, field.key);
          const normalizedValue: string | boolean | undefined =
            rawValue === null || rawValue === undefined
              ? undefined
              : typeof rawValue === "boolean"
                ? rawValue
                : String(rawValue);
          return {
            label: field.label,
            type: field.type,
            value: normalizedValue,
          };
        }),
    }))
    .filter((section) => section.fields.length > 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <AutoDownloadPdf buttonId="report-download-pdf" />

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/history" className="btn btn-ghost btn-icon rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-secondary-text md:text-3xl">
              {report.title}
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {report.patient?.name || t("Paciente sin asignar")} - {getReportKindLabel(reportKind)} - {getPatientCategoryLabel(patientCategory)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ReportStatusSelector reportId={report.id} initialStatus={report.status} />
          <ReportPdfButton
            filename={pdfFilename}
            buttonId="report-download-pdf"
            title={pdfCoverTitle}
            reportTitle={report.title}
            patientName={patientLabel}
            documentType={getPdfKindDescriptor(reportKind, t)}
            groupLabel={getPdfCategoryDescriptor(patientCategory, t)}
            legalNotice={EMOTIVA_LEGAL_NOTICE}
            updatedAt={new Date(report.updatedAt).toLocaleString(locale)}
            sections={pdfSections}
            signatureName={resolvedSignatureName || t("Firma no disponible")}
            signatureImage={resolvedSignatureImage}
            stampImage={resolvedStampImage}
          />
          <Link href={`/dashboard/new-report/editor?id=${report.id}`} className="btn btn-secondary">
            <Edit3 className="h-4 w-4" /> {t("Editar")}
          </Link>
        </div>
      </div>

      <div id="report-detail-print" className="card space-y-8 overflow-hidden p-8">
        <div className="overflow-hidden rounded-[28px] border border-blue-100 bg-white">
          <div className="h-10 bg-gradient-to-r from-[#a7d3f5] via-[#d8d2ff] to-[#ffffff]" />
          <div className="px-8 pb-8 pt-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-700">Centro Psicologico Emotiva</p>
                <p className="mt-1 text-sm font-semibold italic text-slate-700">{EMOTIVA_LEGAL_NOTICE}</p>
              </div>
              <div className="w-[160px] shrink-0">
                <img src="/emotiva-dashboard-logo.jpeg" alt="Centro Psicologico Emotiva" className="h-auto w-full object-contain" />
              </div>
            </div>

            <div className="mt-8 text-center">
              <h2 className="text-4xl font-black tracking-tight text-slate-900">{heading}</h2>
              <p className="mt-3 text-sm font-semibold text-slate-500">{report.title}</p>
              <p className="mt-1 text-sm font-medium text-slate-400">
                Actualizado: {new Date(report.updatedAt).toLocaleString(locale)}
              </p>
            </div>

            {report.versions.length > 0 && (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {report.versions.map((version) => (
                  <span key={version.id} className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-slate-500">
                     V{version.version} - {new Date(version.createdAt).toLocaleDateString(locale)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {sections.map((section) => {
          const visibleFields = section.fields.filter((field) => {
            const value = getReportFieldValue(fields, field.key);
            return hasReportFieldValue(value);
          });

          if (visibleFields.length === 0) return null;

          return (
            <section key={section.id} className="space-y-4">
              <h3 className="text-lg font-extrabold text-secondary-text">{section.title}</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {visibleFields.map((field) => (
                  <div key={field.key} className={`rounded-2xl border border-slate-100 bg-slate-50 p-4 ${field.type === "textarea" || field.type === "image" ? "md:col-span-2" : ""}`}>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">{field.label}</p>
                    {renderFieldValue(field, getReportFieldValue(fields, field.key))}
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        <section className="rounded-[28px] border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-extrabold text-secondary-text">{t("Firma")}</h3>
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">{t("Bloque de firma")}</p>
              <p className="mt-2 text-sm font-bold text-secondary-text">{resolvedSignatureName || t("Firma no disponible")}</p>
              {resolvedSignatureImage ? (
                <img src={resolvedSignatureImage} alt={t("Firma del profesional")} className="mt-4 max-h-32 w-auto object-contain" />
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-400">
                  {t("con firma")}
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">{t("Sello")}</p>
              {resolvedStampImage ? (
                <img src={resolvedStampImage} alt={t("Sello institucional")} className="mt-4 max-h-32 w-auto object-contain" />
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-400">
                  {t("con sello")}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="pointer-events-none fixed left-[-200vw] top-0 w-[794px] bg-white text-slate-900" aria-hidden="true">
        <div id="report-pdf-export" className="bg-white">
          <section className="min-h-[1123px] overflow-hidden bg-[#eef0f4] px-[54px] py-[46px]">
            <div className="flex h-full flex-col rounded-[34px] border border-slate-200/80 bg-[linear-gradient(180deg,#fdfdfd_0%,#f4f5f8_100%)] p-[34px] shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="mx-auto h-2 w-40 rounded-full bg-slate-200">
                <div className="h-full w-24 rounded-full bg-[linear-gradient(90deg,#3b82f6_0%,#06b6d4_55%,#34d399_100%)]" />
              </div>

              <div className="mt-10 flex items-start justify-between gap-8">
                <div className="max-w-[360px]">
                  <p className="text-[11px] font-black uppercase tracking-[0.34em] text-slate-500">Centro Psicologico Emotiva</p>
                  <p className="mt-4 text-[16px] font-black uppercase tracking-[0.2em] text-slate-500">
                     {getPdfKindDescriptor(reportKind, t)}
                  </p>
                  <p className="mt-3 text-[34px] font-black leading-[1.02] text-slate-900">
                    {pdfCoverTitle}
                  </p>
                  <p className="mt-5 text-[26px] font-black leading-tight text-slate-700">
                    {patientLabel}
                  </p>
                  <p className="mt-3 text-base font-semibold leading-relaxed text-slate-500">
                    {report.title}
                  </p>
                </div>
                <div className="rounded-[28px] bg-[linear-gradient(180deg,#7ba7de_0%,#4f83d0_100%)] p-6 shadow-[0_18px_45px_rgba(59,130,246,0.24)]">
                  <img
                    src="/emotiva-dashboard-logo.jpeg"
                    alt="Centro Psicologico Emotiva"
                    className="h-[170px] w-[170px] rounded-[18px] object-cover"
                  />
                </div>
              </div>

              <div className="mt-10 rounded-[30px] border border-white/80 bg-white/75 px-8 py-7 shadow-[0_18px_40px_rgba(148,163,184,0.16)]">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">{t("Datos del documento")}</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[22px] bg-[#f4f7fb] p-5">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{t("Paciente")}</p>
                     <p className="mt-2 text-lg font-black text-slate-900">{getPdfKindDescriptor(reportKind, t)}</p>
                  </div>
                  <div className="rounded-[22px] bg-[#f4f7fb] p-5">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{t("Fecha")}</p>
                     <p className="mt-2 text-lg font-black text-slate-900">{getPdfCategoryDescriptor(patientCategory, t)}</p>
                  </div>
                  <div className="rounded-[22px] bg-[#f4f7fb] p-5 sm:col-span-2">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{t("Profesional")}</p>
                    <p className="mt-2 text-lg font-black text-slate-900">{report.title}</p>
                  </div>
                  <div className="rounded-[22px] bg-[#f4f7fb] p-5">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{t("Categoría")}</p>
                    <p className="mt-2 text-lg font-black text-slate-900">{patientLabel}</p>
                  </div>
                  <div className="rounded-[22px] bg-[#f4f7fb] p-5">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{t("Tipo de informe")}</p>
                    <p className="mt-2 text-lg font-black text-slate-900">
                       {new Date(report.updatedAt).toLocaleString(locale)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-auto rounded-[28px] bg-[linear-gradient(135deg,rgba(94,149,216,0.08)_0%,rgba(208,197,242,0.08)_100%)] px-7 py-6">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{t("Contenido clínico")}</p>
                <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-600">{EMOTIVA_LEGAL_NOTICE}</p>
              </div>
            </div>
          </section>

          <section className="min-h-[1123px] bg-white px-[54px] py-[46px]">
            <div className="space-y-8 rounded-[34px] border border-slate-200 bg-white p-[34px] shadow-[0_16px_36px_rgba(15,23,42,0.05)]">
              <header className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-8 py-8">
                <div className="flex items-start justify-between gap-6">
                  <div className="max-w-[470px]">
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Centro Psicologico Emotiva</p>
                    <h2 className="mt-4 text-[30px] font-black uppercase leading-tight text-slate-900">{pdfCoverTitle}</h2>
                    <p className="mt-3 text-[23px] font-black leading-tight text-slate-700">{patientLabel}</p>
                    <p className="mt-4 text-[14px] font-semibold leading-7 text-slate-500">{report.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{t("Notas")}</p>
                    <p className="mt-2 text-[15px] font-bold text-slate-700">
                      {new Date(report.updatedAt).toLocaleDateString(locale)}
                    </p>
                    <p className="mt-6 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{t("Aviso legal")}</p>
                    <p className="mt-2 text-[15px] font-bold text-slate-700">{getPdfKindDescriptor(reportKind, t)}</p>
                    <p className="mt-6 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{t("Fecha")}</p>
                    <p className="mt-2 text-[15px] font-bold text-slate-700">{getPdfCategoryDescriptor(patientCategory, t)}</p>
                  </div>
                </div>
              </header>

              {sections.map((section) => {
                const visibleFields = section.fields.filter((field) => {
                  const value = getReportFieldValue(fields, field.key);
                  return hasReportFieldValue(value);
                });

                if (visibleFields.length === 0) return null;

                return (
                  <section key={`pdf-${section.id}`} className="break-inside-avoid space-y-4">
                    <div className="border-b border-slate-200 pb-3">
                      <h3 className="text-[22px] font-black text-slate-900">{section.title}</h3>
                      {section.description && (
                        <p className="mt-2 text-[13px] font-medium leading-6 text-slate-500">{section.description}</p>
                      )}
                    </div>
                    <div className="space-y-4">
                      {visibleFields.map((field) => (
                        <div
                          key={`pdf-${section.id}-${field.key}`}
                          className="break-inside-avoid rounded-[24px] border border-slate-200 bg-white px-5 py-5"
                        >
                          <p className="text-[12px] font-black uppercase tracking-[0.16em] text-slate-500">{field.label}</p>
                          {renderPdfExportFieldValue(field, getReportFieldValue(fields, field.key))}
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}

              <section className="break-inside-avoid rounded-[28px] border border-slate-200 bg-white p-6">
                <h3 className="text-[22px] font-black text-slate-900">{t("Firma")}</h3>
                <div className="mt-5 grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[12px] font-black uppercase tracking-[0.16em] text-slate-500">{t("Bloque de firma")}</p>
                    <p className="mt-2 text-[15px] font-bold text-slate-800">{resolvedSignatureName || t("Firma no disponible")}</p>
                    {resolvedSignatureImage ? (
                      <img src={resolvedSignatureImage} alt={t("Firma del profesional")} className="mt-4 max-h-32 w-auto object-contain" />
                    ) : (
                      <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-400">
                        {t("con sello")}
                      </div>
                    )}
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[12px] font-black uppercase tracking-[0.16em] text-slate-500">{t("Sello")}</p>
                    {resolvedStampImage ? (
                      <img src={resolvedStampImage} alt={t("Sello institucional")} className="mt-4 max-h-32 w-auto object-contain" />
                    ) : (
                      <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-400">
                        {t("con firma")}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
