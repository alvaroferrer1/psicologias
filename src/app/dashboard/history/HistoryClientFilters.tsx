"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";

type Props = {
  currentQ?: string;
  currentType?: string;
  currentStatus?: string;
};

export default function HistoryClientFilters({
  currentQ = "",
  currentType = "",
  currentStatus = "",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(currentQ);
  const [type, setType] = useState(currentType);
  const [status, setStatus] = useState(currentStatus);

  useEffect(() => {
    const timeout = setTimeout(() => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());

        if (query.trim()) {
          params.set("q", query.trim());
        } else {
          params.delete("q");
        }

        if (type) {
          params.set("type", type);
        } else {
          params.delete("type");
        }

        if (status) {
          params.set("status", status);
        } else {
          params.delete("status");
        }

        const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
        router.replace(nextUrl, { scroll: false });
      });
    }, 250);

    return () => clearTimeout(timeout);
  }, [pathname, query, router, searchParams, status, type]);

  const resetFilters = () => {
    setQuery("");
    setType("");
    setStatus("");
    router.replace(pathname, { scroll: false });
  };

  const hasFilters = Boolean(query || type || status);

  return (
    <div className="card p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
              isPending ? "text-primary animate-pulse" : "text-slate-400"
            }`}
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="inp pl-9"
            placeholder="Buscar por paciente o documento..."
            aria-label="Buscar informes"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:w-auto">
          <div className="relative min-w-[160px]">
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="inp appearance-none pl-9"
              aria-label="Filtrar por tipo"
            >
              <option value="">Todos los tipos</option>
              <option value="General">General</option>
              <option value="TC">TC</option>
              <option value="TL">TL</option>
              <option value="TCC">TCC</option>
              <option value="TF">TF</option>
              <option value="TP">TP</option>
              <option value="adulto">Adulto</option>
              <option value="adolescente">Adolescente</option>
              <option value="infantil">Infantil</option>
              <option value="pareja">Pareja</option>
              <option value="familia">Familia</option>
              <option value="escolar">Escolar</option>
            </select>
          </div>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="inp min-w-[170px]"
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los estados</option>
            <option value="Borrador">Borrador</option>
            <option value="En revisión">En revisión</option>
            <option value="Completado">Completado</option>
            <option value="Finalizado">Finalizado</option>
          </select>

          {hasFilters && (
            <button type="button" onClick={resetFilters} className="btn btn-ghost">
              <X className="h-4 w-4" /> Limpiar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
