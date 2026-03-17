"use client";

import { Search } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect } from "react";

export function SearchInput({ placeholder = "Buscar..." }: { placeholder?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  useEffect(() => {
    // Debounce manual para no saturar al router
    const timeout = setTimeout(() => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams);
        if (query) {
          params.set("q", query);
        } else {
          params.delete("q");
        }
        router.replace(`${pathname}?${params.toString()}`);
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, router, pathname, searchParams]);

  return (
    <div className="relative w-full sm:max-w-xs group">
      <Search className={`w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isPending ? 'text-primary animate-pulse' : 'text-slate-400 group-focus-within:text-primary'}`} />
      <input 
        type="text" 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder} 
        className="inp pl-9 py-2 bg-white"
      />
    </div>
  );
}
