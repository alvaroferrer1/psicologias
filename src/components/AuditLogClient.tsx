"use client";

import { useState } from "react";
import { Activity, Search, ShieldCheck } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";

type AuditLogRow = {
  id: string;
  createdAt: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: string;
};

export function AuditLogClient({ logs }: { logs: AuditLogRow[] }) {
  const [query, setQuery] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

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
    return matchesQuery && matchesEntity;
  });

  const exportRows = filteredLogs.map((log) => ({
    Fecha: new Date(log.createdAt).toLocaleString("es-ES"),
    Accion: log.action,
    Entidad: log.entityType,
    Referencia: log.entityId,
    Metadata: log.metadata,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-secondary-text md:text-3xl">
            <Activity className="h-8 w-8 text-primary" /> Auditoria
          </h1>
          <p className="mt-1 text-slate-500">Trazabilidad persistente de acciones sobre datos clinicos.</p>
        </div>
        <ExportButton data={exportRows} className="btn btn-primary" label="Exportar CSV" icon={false} />
      </div>

      <div className="card">
        <div className="grid gap-3 border-b border-secondary-border bg-slate-50 p-4 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por accion, entidad, referencia o metadata..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="inp bg-white py-2 pl-9"
            />
          </div>
          <select value={entityFilter} onChange={(event) => setEntityFilter(event.target.value)} className="inp bg-white py-2">
            <option value="">Todas las entidades</option>
            {entityTypes.map((entityType) => (
              <option key={entityType} value={entityType}>
                {entityType}
              </option>
            ))}
          </select>
        </div>

        <div className="divide-y divide-secondary-border">
          {filteredLogs.length === 0 ? (
            <div className="p-10 text-center text-sm font-medium text-slate-500">
              No hay registros que coincidan con los filtros.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-4 p-4 transition-colors hover:bg-slate-50">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold text-secondary-text">
                    {log.action} <span className="ml-1 font-medium text-slate-400">en {log.entityType}</span>
                  </p>
                  <p className="mt-0.5 text-[13px] text-slate-500">
                    ID: {log.entityId || "sin referencia"}
                  </p>
                  {log.metadata && <p className="mt-1 truncate text-xs text-slate-400">{log.metadata}</p>}
                </div>
                <div className="whitespace-nowrap text-[12px] font-bold text-slate-400">
                  {new Date(log.createdAt).toLocaleString("es-ES")}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
