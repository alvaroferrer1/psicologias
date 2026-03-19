import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit3 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { AutoDownloadPdf } from "@/components/AutoDownloadPdf";
import { ReportPdfButton } from "@/components/ReportPdfButton";
import { parseStoredReportContent } from "@/lib/report-content";
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

function renderFieldValue(field: ReportFieldDefinition, value: string | boolean | undefined) {
  if (!value) return null;
  if (field.type === "image" && typeof value === "string") {
    return <img src={value} alt={field.label} className="max-h-64 w-auto rounded-xl object-contain" />;
  }
  return <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-700">{String(value)}</p>;
}

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
    (typeof fields.signature_name === "string" && fields.signature_name) ||
    report.user?.name ||
    "";
  const resolvedSignatureImage =
    (typeof fields.signature_image === "string" && fields.signature_image) ||
    report.user?.signatureDataUrl ||
    "";
  const resolvedStampImage =
    (typeof fields.institution_stamp_image === "string" && fields.institution_stamp_image) ||
    report.user?.stampDataUrl ||
    "";
  const pdfFilename = `documento_${report.patient?.name?.replace(/\s+/g, "_") || "sin_paciente"}_${report.id.slice(0, 8)}.pdf`;
  const heading = getPdfDocumentHeading(reportKind);

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
              {report.patient?.name || "Paciente sin asignar"} - {getReportKindLabel(reportKind)} - {getPatientCategoryLabel(patientCategory)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <ReportPdfButton targetId="report-detail-print" filename={pdfFilename} buttonId="report-download-pdf" />
          <Link href={`/dashboard/new-report/editor?id=${report.id}`} className="btn btn-secondary">
            <Edit3 className="h-4 w-4" /> Editar
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
                Actualizado: {new Date(report.updatedAt).toLocaleString("es-ES")}
              </p>
            </div>

            {report.versions.length > 0 && (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {report.versions.map((version) => (
                  <span key={version.id} className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    V{version.version} - {new Date(version.createdAt).toLocaleDateString("es-ES")}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {sections.map((section) => {
          const visibleFields = section.fields.filter((field) => {
            const value = fields[field.key];
            return value !== undefined && value !== null && value !== "";
          });

          if (visibleFields.length === 0) return null;

          return (
            <section key={section.id} className="space-y-4">
              <h3 className="text-lg font-extrabold text-secondary-text">{section.title}</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {visibleFields.map((field) => (
                  <div key={field.key} className={`rounded-2xl border border-slate-100 bg-slate-50 p-4 ${field.type === "textarea" || field.type === "image" ? "md:col-span-2" : ""}`}>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">{field.label}</p>
                    {renderFieldValue(field, fields[field.key])}
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        <section className="rounded-[28px] border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-extrabold text-secondary-text">Firma y sello</h3>
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">Psicologa evaluadora</p>
              <p className="mt-2 text-sm font-bold text-secondary-text">{resolvedSignatureName || "Pendiente de firma"}</p>
              {resolvedSignatureImage ? (
                <img src={resolvedSignatureImage} alt="Firma" className="mt-4 max-h-32 w-auto object-contain" />
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-400">
                  Si no hay firma digital subida, imprime el documento y firma manualmente.
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">Sello institucional</p>
              {resolvedStampImage ? (
                <img src={resolvedStampImage} alt="Sello institucional" className="mt-4 max-h-32 w-auto object-contain" />
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-400">
                  Si no hay sello digital subido, imprime el documento y sella manualmente.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
