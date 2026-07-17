"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Search, ShieldCheck, FileText, UserRound, CalendarDays, KeyRound, Trash2, Filter, Clock } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";
import { useT } from "@/lib/useT";

type AuditLogRow = {
  id: string;
  createdAt: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: string;
};

type CategoryId = "auth" | "data" | "patient" | "appointment" | "delete" | "system";

export function AuditLogClient({ logs }: { logs: AuditLogRow[] }) {
  const { t, lang } = useT();
  const locale = lang === "en" ? "en-US" : "es-ES";
  const [query, setQuery] = useState("");

  const CATEGORIES = [
    { id: "auth", label: t("Autenticación"), icon: KeyRound, tint: "bg-amber-50 text-amber-600", dot: "bg-amber-400" },
    { id: "data", label: t("Datos"), icon: FileText, tint: "bg-violet-50 text-violet-600", dot: "bg-violet-400" },
    { id: "patient", label: t("Paciente"), icon: UserRound, tint: "bg-blue-50 text-blue-600", dot: "bg-blue-400" },
    { id: "appointment", label: t("Cita"), icon: CalendarDays, tint: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-400" },
    { id: "delete", label: t("Eliminación"), icon: Trash2, tint: "bg-red-50 text-red-600", dot: "bg-red-400" },
    { id: "system", label: t("Sistema"), icon: ShieldCheck, tint: "bg-primary-light text-primary", dot: "bg-primary" },
  ] as const;

  function categoryOf(action: string, entityType: string): CategoryId {
    const a = `${action} ${entityType}`.toLowerCase();
    if (a.includes("login") || a.includes("auth") || a.includes("session") || a.includes("password")) return "auth";
    if (a.includes("delete") || a.includes("remove") || a.includes("trash")) return "delete";
    if (a.includes("patient")) return "patient";
    if (a.includes("appointment") || a.includes("cita")) return "appointment";
    if (a.includes("report") || a.includes("informe") || a.includes("consent")) return "data";
    return "system";
  }

  function actionMeta(action: string, entityType: string) {
    const id = categoryOf(action, entityType);
    const cat = CATEGORIES.find((c) => c.id === id) || CATEGORIES[5];
    return { icon: cat.icon, tint: cat.tint, dot: cat.dot, label: cat.label };
  }

  function dayLabel(iso: string) {
    const d = new Date(iso);
    const today = new Date();
    const yest = new Date();
    yest.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return t("Hoy");
    if (d.toDateString() === yest.toDateString()) return t("Ayer");
    return d.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }

  const [entityFilter, setEntityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryId | "">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const entityTypes = [...new Set(logs.map((log) => log.entityType))].sort();

  const filteredLogs = logs.filter((log) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      log.action.toLowerCase().includes(q) ||
      log.entityType.toLowerCase().includes(q) ||
      log.entityId.toLowerCase().includes(q) ||
      log.metadata.toLowerCase().includes(q);
    const matchesEntity = !entityFilter || log.entityType === entityFilter;
    const matchesCategory = !categoryFilter || categoryOf(log.action, log.entityType) === categoryFilter;
    const ts = new Date(log.createdAt).getTime();
    const from = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : null;
    const to = toDate ? new Date(toDate).setHours(23, 59, 59, 999) : null;
    const matchesFrom = from === null || ts >= from;
    const matchesTo = to === null || ts <= to;
    return matchesQuery && matchesEntity && matchesCategory && matchesFrom && matchesTo;
  });

  const counts = CATEGORIES.map((cat) => ({
    ...cat,
    value: logs.filter((log) => categoryOf(log.action, log.entityType) === cat.id).length,
  }));

  const exportRows = filteredLogs.map((log) => ({
    Fecha: new Date(log.createdAt).toLocaleString(locale),
    Categoria: CATEGORIES.find((c) => c.id === categoryOf(log.action, log.entityType))?.label || t("Sistema"),
    Accion: log.action,
    Entidad: log.entityType,
    Referencia: log.entityId,
    Metadata: log.metadata,
  }));

  const groups: { label: string; items: AuditLogRow[] }[] = [];
  for (const log of filteredLogs) {
    const label = dayLabel(log.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(log);
    else groups.push({ label, items: [log] });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-secondary-text md:text-3xl">
            <Activity className="h-8 w-8 text-primary" /> {t("Auditoría")}
          </h1>
          <p className="mt-1 text-slate-500">{t("Registro de actividad de la cuenta y la clínica.")}</p>
        </div>
        <ExportButton data={exportRows} className="btn btn-primary" label={t("Exportar")} icon={false} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {counts.map((cat) => {
          const Icon = cat.icon;
          const isActive = categoryFilter === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(isActive ? "" : (cat.id as CategoryId))}
              className={`flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all ${isActive ? "border-primary bg-primary-light shadow-sm" : "border-secondary-border bg-white hover:border-primary/30"}`}
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${cat.tint}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-xl font-black text-secondary-text">{cat.value}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{cat.label}</p>
            </button>
          );
        })}
      </div>

      <div className="card">
        <div className="grid gap-3 border-b border-secondary-border bg-slate-50 p-4 md:grid-cols-[1.4fr_1fr_1fr] dark:bg-[var(--color-secondary-card)]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t("Buscar en la auditoría...")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="inp bg-white py-2 pl-9"
            />
          </div>
          <select value={entityFilter} onChange={(event) => setEntityFilter(event.target.value)} className="inp bg-white py-2">
            <option value="">{t("Todas las categorías")}</option>
            {entityTypes.map((entityType) => (
              <option key={entityType} value={entityType}>
                {entityType}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="inp bg-white py-2 text-xs" aria-label={t("Desde")} />
            <span className="text-xs text-slate-400">-</span>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="inp bg-white py-2 text-xs" aria-label={t("Hasta")} />
          </div>
        </div>

        {(categoryFilter !== "" || fromDate || toDate || query || entityFilter) && (
          <div className="flex items-center gap-2 border-b border-secondary-border bg-primary-light/50 px-4 py-2 text-sm font-semibold text-primary">
            <Filter className="h-4 w-4" />
            {t("Filtrar")}
            <button type="button" onClick={() => { setQuery(""); setEntityFilter(""); setCategoryFilter(""); setFromDate(""); setToDate(""); }} className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-500 hover:text-primary">
              {t("Limpiar filtros")}
            </button>
          </div>
        )}

        {filteredLogs.length === 0 ? (
          <div className="p-10 text-center text-sm font-medium text-slate-500">
            {t("Sin resultados")}
          </div>
        ) : (
          <div className="divide-y divide-secondary-border">
            {groups.map((group) => (
              <div key={group.label}>
                <div className="sticky top-0 z-10 flex items-center gap-2 bg-slate-50 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-400 dark:bg-[var(--color-secondary-card)]">
                  <Clock className="h-3.5 w-3.5" />
                  {group.label}
                  <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-400">{group.items.length}</span>
                </div>
                <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.03 } } }}>
                  {group.items.map((log) => {
                    const meta = actionMeta(log.action, log.entityType);
                    const Icon = meta.icon;
                    return (
                      <motion.div
                        key={log.id}
                        variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                        className="flex items-center gap-4 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.tint}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-bold text-secondary-text">
                             {log.action} <span className="ml-1 font-medium text-slate-400">{t("sobre")} {log.entityType}</span>
                          </p>
                           <p className="mt-0.5 text-[13px] text-slate-500">
                            ID: {log.entityId || t("Sin ID")}
                          </p>
                          {log.metadata && <p className="mt-1 line-clamp-1 text-xs text-slate-400">{log.metadata}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`hidden items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider sm:flex ${meta.tint}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} /> {meta.label}
                          </span>
                          <span className="whitespace-nowrap text-[12px] font-bold text-slate-400">
                            {new Date(log.createdAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
