"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/useT";

export default function TopbarSearch() {
  const router = useRouter();
  const { t } = useT();
  const [query, setQuery] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) return;
    router.push(`/dashboard/search?q=${encodeURIComponent(cleanQuery)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="hidden min-w-[280px] flex-1 max-w-xl lg:block">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={"Buscar pacientes, informes, citas..."}
          className="topbar-search h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
        />
      </div>
    </form>
  );
}
