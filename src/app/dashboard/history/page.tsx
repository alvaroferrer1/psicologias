import { Prisma } from "@prisma/client";
import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Edit3,
  FileText,
  Plus,
  RefreshCcw,
} from "lucide-react";
import { ExportButton } from "@/components/ExportButton";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPatientCategoryLabel, getReportKindLabel } from "@/lib/report-templates";
import { cn } from "@/lib/utils";
import HistoryClientFilters from "./HistoryClientFilters";

function isCompletedStatus(status: string) {
  return status === "Completado" || status === "Finalizado";
}

function isReviewStatus(status: string) {
  return status === "En revision" || status === "En revisión";
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; kind?: string; status?: string }>;
}) {
  const user = await requireCurrentUser();
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams?.q || "";
  const categoryFilter = resolvedSearchParams?.category || "";
  const kindFilter = resolvedSearchParams?.kind || "";
  const statusFilter = resolvedSearchParams?.status || "";

  const where: Prisma.ReportWhereInput = {
    deletedAt: null,
    OR: [{ userId: user.id }, { userId: null }],
  };

  const conditions: Prisma.ReportWhereInput[] = [];

  if (query) {
    conditions.push({
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { patient: { name: { contains: query, mode: "insensitive" } } },
      ],
    });
  }

  if (categoryFilter) {
    conditions.push({
      OR: [{ patientCategory: categoryFilter }, { type: categoryFilter }],
    });
  }

  if (kindFilter) {
    conditions.push({
      OR: [{ reportKind: kindFilter }, { type: kindFilter }],
    });
  }

  if (statusFilter) {
    conditions.push({ status: statusFilter });
  }

  if (conditions.length > 0) {
    where.AND = conditions;
  }

  const reports = await prisma.report.findMany({
    where,
    include: { patient: true, versions: true },
    orderBy: { updatedAt: "desc" },
  });

  const completedReports = reports.filter((report) => isCompletedStatus(report.status)).length;
  const draftReports = reports.filter((report) => report.status === "Borrador").length;
  const currentMonth = new Date().getMonth();
  const reportsThisMonth = reports.filter((report) => new Date(report.updatedAt).getMonth() === currentMonth).length;

  const exportData = reports.map((report) => ({
    ID: report.id,
    Paciente: report.patient?.name || "Sin paciente",
    Documento: report.title,
    Formato: getReportKindLabel(report.reportKind || report.type),
    Categoria: getPatientCategoryLabel(report.patientCategory || report.type),
    Estado: report.status,
    Fecha: new Date(report.createdAt).toLocaleString("es-ES"),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-secondary-text md:text-3xl">
            Mis Informes
          </h2>
          <p className="mt-1 font-medium text-slate-500">
            {reports.length} documento{reports.length !== 1 ? "s" : ""} encontrado{reports.length !== 1 ? "s" : ""}
            {(query || categoryFilter || kindFilter || statusFilter) && " (filtrado)"}
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={exportData}
            filename={`informes_emotiva_${new Date().toISOString().slice(0, 10)}.csv`}
            className="btn btn-ghost border-slate-200 text-slate-600 hover:bg-slate-100"
            title="Exportar CSV completo"
          />
          <Link href="/dashboard/new-report" className="btn btn-primary whitespace-nowrap">
            <Plus className="h-5 w-5" /> Nuevo
          </Link>
        </div>
      </div>

      <HistoryClientFilters
        key={`${query}|${categoryFilter}|${kindFilter}|${statusFilter}`}
        currentQ={query}
        currentCategory={categoryFilter}
        currentKind={kindFilter}
        currentStatus={statusFilter}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <div className="card p-5">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total</p>
          <p className="mt-2 text-3xl font-black text-secondary-text">{reports.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Finalizados</p>
          <p className="mt-2 text-3xl font-black text-secondary-text">{completedReports}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Borradores</p>
          <p className="mt-2 text-3xl font-black text-secondary-text">{draftReports}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Actividad mes</p>
          <p className="mt-2 text-3xl font-black text-secondary-text">{reportsThisMonth}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-secondary-border bg-slate-50/70 px-4 py-3">
          <div className="mx-auto h-1.5 w-40 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-24 rounded-full bg-gradient-to-r from-primary via-blue-400 to-violet-300" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className="border-b border-secondary-border bg-slate-50/50 font-bold text-slate-500">
              <tr>
                <th className="rounded-tl-xl px-6 py-4 text-[13px] font-bold uppercase tracking-wide">Paciente / Documento</th>
                <th className="px-6 py-4 text-[13px] font-bold uppercase tracking-wide">Tipo</th>
                <th className="px-6 py-4 text-[13px] font-bold uppercase tracking-wide">Formato</th>
                <th className="px-6 py-4 text-[13px] font-bold uppercase tracking-wide">Fecha</th>
                <th className="px-6 py-4 text-[13px] font-bold uppercase tracking-wide">Estado</th>
                <th className="px-6 py-4 text-[13px] font-bold uppercase tracking-wide">Versiones</th>
                <th className="rounded-tr-xl px-6 py-4 text-right text-[13px] font-bold uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-border/60 font-medium text-slate-600">
              {reports.length === 0 && (
                <tr>
                  <td colSpan={7} className="bg-slate-50 p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                        <FileText className="h-7 w-7 text-slate-400" />
                      </div>
                      <p className="text-[15px] font-bold text-slate-400">No se encontraron documentos</p>
                      <p className="text-[13px] text-slate-400">
                        Prueba a cambiar los filtros o{" "}
                        <Link href="/dashboard/new-report" className="font-bold text-primary hover:underline">
                          crea un nuevo documento
                        </Link>
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {reports.map((report) => {
                const isCompleted = isCompletedStatus(report.status);
                const isBorrador = report.status === "Borrador";
                const isReview = isReviewStatus(report.status);

                return (
                  <tr key={report.id} className="group transition-colors hover:bg-primary-light/40">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border shadow-sm",
                            isCompleted ? "border-emerald-100 bg-emerald-50 text-emerald-600" : "border-blue-100 bg-blue-50 text-primary"
                          )}
                        >
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <Link prefetch={false} href={`/dashboard/history/${report.id}`} className="text-[15px] font-bold text-secondary-text transition-colors hover:text-primary">
                            {report.patient?.name || "Paciente eliminado"}
                          </Link>
                          <p className="mt-0.5 max-w-[300px] truncate text-[13px] text-slate-400">{report.title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-blue-800">
                        {getPatientCategoryLabel(report.patientCategory || report.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-violet-800">
                        {getReportKindLabel(report.reportKind || report.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[13px] font-medium text-slate-500">
                      {new Date(report.updatedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Completado
                        </span>
                      ) : isBorrador ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-100 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-amber-800">
                          <RefreshCcw className="h-3.5 w-3.5" /> Borrador
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-100 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-sky-800">
                          <Clock className="h-3.5 w-3.5" /> {report.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-slate-500">
                        <BarChart3 className="h-3.5 w-3.5" /> {report.versions.length}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link prefetch={false} href={`/dashboard/history/${report.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-[12px] font-bold text-slate-500 transition-colors hover:border-slate-200 hover:bg-slate-50 hover:text-slate-800">
                          Ver
                        </Link>
                        <Link
                          prefetch={false}
                          href={`/dashboard/history/${report.id}?download=1`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-[12px] font-bold text-primary transition-colors hover:border-primary/20 hover:bg-primary-light"
                        >
                          PDF
                        </Link>
                        {(isBorrador || isReview) && (
                          <Link prefetch={false} href={`/dashboard/new-report/editor?id=${report.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-[12px] font-bold text-primary transition-colors hover:border-primary/20 hover:bg-primary-light">
                            <Edit3 className="h-3.5 w-3.5" /> Continuar
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
