"use client";

import Image from "next/image";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import TopbarSearch from "@/components/TopbarSearch";
import { TopbarNotifications } from "@/components/TopbarNotifications";

type TopbarUser = {
  name?: string | null;
};

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  href?: string;
};

export default function Topbar({ user, notifications = [] }: { user?: TopbarUser | null; notifications?: NotificationItem[] }) {
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
        <TopbarNotifications items={notifications} />
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:hidden">
          <Image
            src="/emotiva-dashboard-logo.jpeg"
            alt={`Acceso de ${user?.name || "usuario"}`}
            width={40}
            height={40}
            className="h-full w-full object-cover"
            priority
          />
        </div>
      </div>
    </div>
  );
}
