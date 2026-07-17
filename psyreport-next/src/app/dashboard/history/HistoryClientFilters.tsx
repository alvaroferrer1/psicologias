"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useT } from "@/lib/useT";

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
  const { t } = useT();
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
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max items-center gap-3">
          <div className="relative w-[340px] shrink-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="inp pl-9"
            placeholder={t("Buscar informes...")}
            aria-label={t("Buscar")}
          />
          </div>

          <div className="relative min-w-[180px]">
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={category}
              onChange={(event) => {
                const value = event.target.value;
                setCategory(value);
                navigateNow({ q: query, category: value, kind, status });
              }}
              className="inp pl-9"
              aria-label={t("Filtrar por categoría")}
            >
              <option value="">{t("Todas las categorías")}</option>
              <option value="infantil">{t("Infantil")}</option>
              <option value="adolescente">{t("Adolescente")}</option>
              <option value="adulto">{t("Adulto")}</option>
              <option value="pareja">{t("Pareja")}</option>
              <option value="familia">{t("Familia")}</option>
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
              aria-label={t("Filtrar por tipo")}
            >
              <option value="">{t("Todos los tipos")}</option>
              <option value="historia_clinica">{t("Historia clínica")}</option>
              <option value="informe">{t("Informe")}</option>
              <option value="registro">{t("Registro")}</option>
          </select>

          <select
            value={status}
            onChange={(event) => {
              const value = event.target.value;
              setStatus(value);
              navigateNow({ q: query, category, kind, status: value });
            }}
            className="inp min-w-[170px]"
              aria-label={t("Filtrar por estado")}
            >
              <option value="">{t("Todos los estados")}</option>
              <option value="Borrador">{t("Borrador")}</option>
              <option value="En revisiÃ³n">{t("En revisión")}</option>
              <option value="Completado">{t("Completado")}</option>
              <option value="Finalizado">{t("Finalizado")}</option>
          </select>

          <button type="button" onClick={resetFilters} className="btn btn-ghost whitespace-nowrap">
            <X className="h-4 w-4" /> {t("Limpiar filtros")}
          </button>
        </div>
      </div>
    </div>
  );
}
