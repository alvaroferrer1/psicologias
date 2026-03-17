"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import TopbarSearch from "@/components/TopbarSearch";

type TopbarUser = {
  name?: string | null;
};

export default function Topbar({ user }: { user?: TopbarUser | null }) {
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Inicio";
    if (pathname.includes("search")) return "Busqueda global";
    if (pathname.includes("new-report")) return "Nuevo Informe";
    if (pathname.includes("history")) return "Mis Informes";
    if (pathname.includes("patients")) return "Pacientes";
    if (pathname.includes("audit")) return "Auditoría";
    if (pathname.includes("db-guide")) return "Base de Datos";
    if (pathname.includes("settings")) return "Configuración";
    if (pathname.includes("calendar")) return "Calendario Inteligente";
    return "Dashboard";
  };

  const userInitials =
    user?.name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U";

  return (
    <div className="sticky top-0 z-30 flex h-[73px] items-center justify-between border-b border-secondary-border bg-white px-4 pb-[1px] shadow-nav md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          className="p-1 text-slate-500 hover:text-slate-800 lg:hidden"
          type="button"
          onClick={() => window.dispatchEvent(new Event("sidebar:toggle"))}
          aria-label="Abrir menú"
        >
          <Menu className="h-[22px] w-[22px]" />
        </button>
        <h1 className="hidden text-[18px] font-extrabold tracking-tight text-secondary-text sm:block">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-4">
        <TopbarSearch />
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border-[1.5px] border-primary-border bg-gradient-to-br from-primary-muted to-primary-light text-sm font-bold text-primary shadow-sm md:hidden">
          {userInitials}
        </div>
      </div>
    </div>
  );
}
