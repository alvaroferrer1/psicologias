"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";

type Props = {
  currentQ?: string;
  currentCategory?: string;
  currentKind?: string;
  currentStatus?: string;
};

export default function HistoryClientFilters({
  currentQ = "",
  currentCategory = "",
  currentKind = "",
  currentStatus = "",
}: Props) {
  const pathname = usePathname();
  const [query, setQuery] = useState(currentQ);
  const [category, setCategory] = useState(currentCategory);
  const [kind, setKind] = useState(currentKind);
  const [status, setStatus] = useState(currentStatus);

  const buildUrl = useMemo(
    () => (next: { q?: string; category?: string; kind?: string; status?: string }) => {
      const params = new URLSearchParams();

      if ((next.q || "").trim()) params.set("q", (next.q || "").trim());
      if (next.category) params.set("category", next.category);
      if (next.kind) params.set("kind", next.kind);
      if (next.status) params.set("status", next.status);

      const queryString = params.toString();
      return queryString ? `${pathname}?${queryString}` : pathname;
    },
    [pathname]
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (query === currentQ) return;
      window.location.assign(buildUrl({ q: query, category, kind, status }));
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [buildUrl, category, currentQ, kind, query, status]);

  const navigateNow = (next: { q?: string; category?: string; kind?: string; status?: string }) => {
    window.location.assign(buildUrl(next));
  };

  const resetFilters = () => {
    setQuery("");
    setCategory("");
    setKind("");
    setStatus("");
    window.location.assign(pathname);
  };

  return (
    <div className="card p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="inp pl-9"
            placeholder="Buscar por paciente o documento..."
            aria-label="Buscar informes"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <div className="relative min-w-[180px]">
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={category}
              onChange={(event) => {
                const value = event.target.value;
                setCategory(value);
                navigateNow({ q: query, category: value, kind, status });
              }}
              className="inp appearance-none pl-9"
              aria-label="Filtrar por categoria de paciente"
            >
              <option value="">Todos los pacientes</option>
              <option value="infantil">Ninos</option>
              <option value="adolescente">Adolescentes</option>
              <option value="adulto">Adultos</option>
              <option value="pareja">Parejas</option>
              <option value="familia">Familia</option>
            </select>
          </div>

          <select
            value={kind}
            onChange={(event) => {
              const value = event.target.value;
              setKind(value);
              navigateNow({ q: query, category, kind: value, status });
            }}
            className="inp min-w-[180px]"
            aria-label="Filtrar por tipo de documento"
          >
            <option value="">Todos los documentos</option>
            <option value="historia_clinica">Historia clinica</option>
            <option value="informe">Informe</option>
            <option value="registro">Reporte</option>
          </select>

          <select
            value={status}
            onChange={(event) => {
              const value = event.target.value;
              setStatus(value);
              navigateNow({ q: query, category, kind, status: value });
            }}
            className="inp min-w-[170px]"
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los estados</option>
            <option value="Borrador">Borrador</option>
            <option value="En revision">En revision</option>
            <option value="Completado">Completado</option>
            <option value="Finalizado">Finalizado</option>
          </select>

          <button type="button" onClick={resetFilters} className="btn btn-ghost whitespace-nowrap">
            <X className="h-4 w-4" /> Limpiar filtros
          </button>
        </div>
      </div>
    </div>
  );
}
