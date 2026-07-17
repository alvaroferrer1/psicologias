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
  Sparkles,
  TrendingUp,
  User2,
} from "lucide-react";
import { ExportButton } from "@/components/ExportButton";
import { SyncedHorizontalScroll } from "@/components/SyncedHorizontalScroll";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPatientCategoryLabel, getReportKindLabel } from "@/lib/report-templates";
import { cn } from "@/lib/utils";
import { getServerT } from "@/lib/i18n-server";
import HistoryClientFilters from "./HistoryClientFilters";

function isCompletedStatus(status: string) {
  return status === "Completado" || status === "Finalizado";
}

function isReviewStatus(status: string) {
  return status === "En revision" || status === "En revisiÃ³n";
}

function getInitials(name?: string | null) {
  if (!name) return "â€”";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "â€”";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(name?: string | null) {
  const colors = [
    "from-blue-500 to-indigo-500",
    "from-violet-500 to-fuchsia-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-pink-500",
    "from-cyan-500 to-sky-500",
  ];
  const seed = (name || "").split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return colors[seed % colors.length];
}

type StatusStyle = {
  label: string;
  className: string;
  icon: typeof CheckCircle2;
};

function statusStyle(status: string): StatusStyle {
  if (isCompletedStatus(status)) {
    return {
      label: "Completado",
      className: "border-emerald-200 bg-emerald-100 text-emerald-800",
      icon: CheckCircle2,
    };
  }
  if (status === "Borrador") {
    return {
      label: "Borrador",
      className: "border-amber-200 bg-amber-100 text-amber-800",
      icon: RefreshCcw,
    };
  }
  return {
    label: status,
    className: "border-sky-200 bg-sky-100 text-sky-800",
    icon: Clock,
  };
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; kind?: string; status?: string }>;
}) {
  const user = await requireCurrentUser();
  const { t, lang } = await getServerT();
  const locale = lang === "en" ? "en-US" : "es-ES";
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

  const recentReports = [...reports]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  const typeDistribution = (() => {
    const map = new Map<string, number>();
    for (const report of reports) {
      const key = getPatientCategoryLabel(report.patientCategory || report.type);
      map.set(key, (map.get(key) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  })();

  const maxTypeCount = Math.max(1, ...typeDistribution.map((d) => d.count));

  const exportData = reports.map((report) => ({
    ID: report.id,
    Paciente: report.patient?.name || t("Paciente:"),
    Documento: report.title,
    Formato: getReportKindLabel(report.reportKind || report.type),
    Categoria: getPatientCategoryLabel(report.patientCategory || report.type),
    Estado: report.status,
    Fecha: new Date(report.createdAt).toLocaleString(locale),
  }));

  const statCards = [
    {
      label: t("Pacientes"),
      value: reports.length,
      hint: t("Lista y estado de tus pacientes."),
      icon: FileText,
      iconClass: "bg-blue-50 text-primary dark:bg-blue-500/15",
      accent: "text-secondary-text",
    },
    {
      label: t("Informes"),
      value: completedReports,
      hint: t("Genera y revisa informes clínicos."),
      icon: CheckCircle2,
      iconClass: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15",
      accent: "text-emerald-600",
    },
    {
      label: t("Citas"),
      value: draftReports,
      hint: t("Agenda y videoconsultas."),
      icon: RefreshCcw,
      iconClass: "bg-amber-50 text-amber-600 dark:bg-amber-500/15",
      accent: "text-amber-600",
    },
    {
      label: t("Consentimientos"),
      value: reportsThisMonth,
      hint: t("Firma y seguimiento legal."),
      icon: TrendingUp,
      iconClass: "bg-violet-50 text-violet-600 dark:bg-violet-500/15",
      accent: "text-violet-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-light px-3 py-1 text-[11px] font-black uppercase tracking-widest text-primary">
              <Sparkles className="h-3.5 w-3.5" /> {t("Nuevo")}
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-secondary-text md:text-3xl">
            {t("Crear informe")}
          </h2>
          <p className="mt-1 font-medium text-slate-500">
            {reports.length} {t("informes")}{reports.length !== 1 ? t("informe") : ""}
            {(query || categoryFilter || kindFilter || statusFilter) && t("Resultados")}
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={exportData}
            filename={`informes_emotiva_${new Date().toISOString().slice(0, 10)}.csv`}
            className="btn btn-ghost border-slate-200 text-slate-600 hover:bg-slate-100"
            title={t("Nuevo informe")}
          />
          <Link href="/dashboard/new-report" className="btn btn-primary whitespace-nowrap">
            <Plus className="h-5 w-5" /> {t("Crear")}
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
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card group p-5 transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", stat.iconClass)}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{stat.hint}</span>
              </div>
              <p className="mt-3 text-xs font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
              <p className={cn("mt-1 text-3xl font-black tabular-nums", stat.accent)}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-secondary-border px-6 py-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-secondary-text">
            {t("Sin informes todavía.")}
          </h3>
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            {reports.length} {t("informes")}
          </span>
        </div>
        {reports.length === 0 ? (
          <div className="bg-slate-50 p-12">
            <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-light to-blue-100">
                <div className="absolute inset-0 rounded-3xl bg-primary/5 blur-xl" />
                <FileText className="h-9 w-9 text-primary" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-secondary-text">{t("Mis Informes")}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {t("Tus últimos informes y borradores activos.")}
                </p>
              </div>
              <Link href="/dashboard/new-report" className="btn btn-primary">
                <Plus className="h-4 w-4" /> {t("Crear informe")}
              </Link>
            </div>
          </div>
        ) : (
          <SyncedHorizontalScroll>
            <table className="w-full whitespace-nowrap text-left text-sm">
              <thead className="border-b border-secondary-border bg-slate-50/50 font-bold text-slate-500">
                 <tr>
                   <th className="rounded-tl-xl px-6 py-4 text-[13px] font-bold uppercase tracking-wide">{t("Paciente")}</th>
                   <th className="px-6 py-4 text-[13px] font-bold uppercase tracking-wide">{t("Tipo")}</th>
                   <th className="px-6 py-4 text-[13px] font-bold uppercase tracking-wide">{t("Categoría")}</th>
                   <th className="px-6 py-4 text-[13px] font-bold uppercase tracking-wide">{t("Estado")}</th>
                   <th className="px-6 py-4 text-[13px] font-bold uppercase tracking-wide">{t("Actualizado")}</th>
                   <th className="px-6 py-4 text-[13px] font-bold uppercase tracking-wide">{t("Acciones")}</th>
                   <th className="rounded-tr-xl px-6 py-4 text-right text-[13px] font-bold uppercase tracking-wide">{t("Acciones")}</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-secondary-border/60 font-medium text-slate-600">
                {reports.map((report) => {
                  const isBorrador = report.status === "Borrador";
                  const isReview = isReviewStatus(report.status);
                  const status = statusStyle(report.status);
                  const StatusIcon = status.icon;

                  return (
                    <tr key={report.id} className="group transition-colors hover:bg-primary-light/40">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[13px] font-black text-white shadow-sm",
                              getAvatarColor(report.patient?.name)
                            )}
                          >
                            {getInitials(report.patient?.name)}
                          </div>
                          <div>
                            <Link prefetch={false} href={`/dashboard/history/${report.id}`} className="text-[15px] font-bold text-secondary-text transition-colors hover:text-primary">
                               {report.patient?.name || t("Paciente sin asignar")}
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
                           {new Date(report.updatedAt).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-widest", status.className)}>
                          <StatusIcon className="h-3.5 w-3.5" /> {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-slate-500">
                          <BarChart3 className="h-3.5 w-3.5" /> {report.versions.length}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link prefetch={false} href={`/dashboard/history/${report.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-[12px] font-bold text-slate-500 transition-colors hover:border-slate-200 hover:bg-slate-50 hover:text-slate-800">
                             {t("Abrir informe")}
                          </Link>
                          {(isBorrador || isReview) && (
                            <Link prefetch={false} href={`/dashboard/new-report/editor?id=${report.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-[12px] font-bold text-primary transition-colors hover:border-primary/20 hover:bg-primary-light">
                              <Edit3 className="h-3.5 w-3.5" /> {t("Editar")}
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </SyncedHorizontalScroll>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary">
              <Clock className="h-4 w-4" />
            </span>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-secondary-text">
              {t("Borradores")}
            </h3>
          </div>
          {recentReports.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-secondary-border bg-slate-50/50 p-8 text-center">
              <User2 className="h-7 w-7 text-slate-300" />
              <p className="text-sm font-bold text-slate-400">{t("Informes en borrador pendientes de completar.")}</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {recentReports.map((report) => {
                const status = statusStyle(report.status);
                const StatusIcon = status.icon;
                return (
                  <li key={report.id}>
                    <Link
                      prefetch={false}
                      href={`/dashboard/history/${report.id}`}
                      className="flex items-center gap-3 rounded-2xl border border-transparent p-3 transition-colors hover:border-secondary-border hover:bg-slate-50/70"
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[12px] font-black text-white",
                          getAvatarColor(report.patient?.name)
                        )}
                      >
                        {getInitials(report.patient?.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-bold text-secondary-text">
                           {report.patient?.name || t("Paciente sin asignar")}
                        </p>
                        <p className="truncate text-[12px] text-slate-400">
                          {getReportKindLabel(report.reportKind || report.type)} Â·{" "}
                          {new Date(report.updatedAt).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-widest", status.className)}>
                        <StatusIcon className="h-3 w-3" /> {status.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/15">
              <BarChart3 className="h-4 w-4" />
            </span>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-secondary-text">
              {t("Completados")}
            </h3>
          </div>
          {typeDistribution.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-secondary-border bg-slate-50/50 p-8 text-center">
              <BarChart3 className="h-7 w-7 text-slate-300" />
              <p className="text-sm font-bold text-slate-400">{t("Informes finalizados.")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {typeDistribution.map((dist, index) => {
                const pct = Math.round((dist.count / maxTypeCount) * 100);
                const barColors = [
                  "from-blue-500 to-indigo-500",
                  "from-violet-500 to-fuchsia-500",
                  "from-emerald-500 to-teal-500",
                  "from-amber-500 to-orange-500",
                  "from-rose-500 to-pink-500",
                ];
                return (
                  <div key={dist.label}>
                    <div className="mb-1 flex items-center justify-between text-[12px]">
                      <span className="font-bold text-slate-600">{dist.label}</span>
                      <span className="font-black tabular-nums text-slate-400">{dist.count}</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn("h-full rounded-full bg-gradient-to-r", barColors[index % barColors.length])}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
