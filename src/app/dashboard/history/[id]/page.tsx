import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit3, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { ReportPdfButton } from "@/components/ReportPdfButton";

type ReportSection = {
  title: string;
  items: Array<[string, string]>;
};

function buildSections(content: string | null): ReportSection[] {
  if (!content) return [];

  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    const sections: Array<{ title: string; items: Array<[string, unknown]> }> = [
      {
        title: "Profesional",
        items: [
          ["Nombre", parsed.prof_nombre],
          ["Nº colegiado", parsed.prof_colegiado],
          ["Especialidad", parsed.prof_especialidad],
          ["Centro", parsed.prof_centro],
          ["Fecha", parsed.prof_fecha],
        ],
      },
      {
        title: "Paciente",
        items: [
          ["Nombre", parsed.pac_nombre],
          ["Fecha de nacimiento", parsed.pac_dob],
          ["DNI / NIE", parsed.pac_dni],
          ["Direccion", parsed.pac_direccion],
        ],
      },
      {
        title: "Consulta",
        items: [
          ["Motivo de consulta", parsed.consult_motivo],
          ["Antecedentes personales", parsed.consult_pers],
        ],
      },
      {
        title: "Evaluacion",
        items: [
          ["Resumen general", parsed.eval_resumen],
          ["Pruebas y tecnicas", parsed.eval_pruebas],
        ],
      },
      {
        title: "Observaciones",
        items: [
          ["Observaciones de sesiones", parsed.obs_sesiones],
          ["Estado mental", parsed.obs_mental],
        ],
      },
      {
        title: "Hallazgos",
        items: [
          ["Hallazgos", parsed.hall_hallazgos],
          ["Plan de intervencion", parsed.hall_plan],
        ],
      },
      {
        title: "Conclusiones",
        items: [
          ["Conclusiones", parsed.concl_conclusiones],
          ["Recomendaciones", parsed.concl_recomendaciones],
          ["Consentimiento", parsed.consentimiento === true ? "Si" : "No"],
        ],
      },
    ];

    return sections
      .map((section) => ({
        title: section.title,
        items: section.items
          .filter(([, value]) => value !== undefined && value !== null && value !== "")
          .map(([label, value]) => [label, String(value)] as [string, string]),
      }))
      .filter((section) => section.items.length > 0);
  } catch {
    return [
      {
        title: "Contenido del informe",
        items: [["Contenido", content]],
      },
    ];
  }
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
      patient: true,
      versions: {
        orderBy: { version: "desc" },
        take: 5,
      },
    },
  });

  if (!report) {
    notFound();
  }

  const sections = buildSections(report.content);
  const pdfFilename = `informe_${report.patient?.name?.replace(/\s+/g, "_") || "sin_paciente"}_${report.id.slice(0, 8)}.pdf`;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
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
              {report.patient?.name || "Paciente sin asignar"} · {report.type} · {report.status}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <ReportPdfButton targetId="report-detail-print" filename={pdfFilename} />
          <Link href={`/dashboard/new-report/editor?id=${report.id}`} className="btn btn-secondary">
            <Edit3 className="h-4 w-4" /> Editar
          </Link>
        </div>
      </div>

      <div id="report-detail-print" className="card space-y-8 p-8">
        <div className="border-b border-slate-100 pb-6">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary">
            <FileText className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-black text-secondary-text">{report.title}</h2>
          <p className="mt-2 text-sm text-slate-500">
            Fecha de actualizacion: {new Date(report.updatedAt).toLocaleString("es-ES")}
          </p>
          {report.versions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {report.versions.map((version) => (
                <span key={version.id} className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  V{version.version} · {new Date(version.createdAt).toLocaleDateString("es-ES")}
                </span>
              ))}
            </div>
          )}
        </div>

        {sections.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm font-medium text-slate-500">
            Este informe aun no tiene contenido estructurado para mostrar.
          </div>
        ) : (
          sections.map((section) => (
            <section key={section.title} className="space-y-4">
              <h3 className="text-lg font-extrabold text-secondary-text">{section.title}</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {section.items.map(([label, value]) => (
                  <div key={`${section.title}-${label}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-700">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
