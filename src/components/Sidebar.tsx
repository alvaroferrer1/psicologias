"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, FilePlus2, FolderOpen, History, Home, LogOut, Menu, Settings, Trash2, Users, Video, X } from "lucide-react";
import { logoutUser } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

type SidebarUser = {
  name?: string | null;
  role?: string | null;
};

export default function Sidebar({ user }: { user?: SidebarUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    const handleClose = () => setIsOpen(false);

    window.addEventListener("sidebar:toggle", handleToggle);
    window.addEventListener("sidebar:close", handleClose);

    return () => {
      window.removeEventListener("sidebar:toggle", handleToggle);
      window.removeEventListener("sidebar:close", handleClose);
    };
  }, []);

  const userInitials =
    user?.name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U";

  const navLinks = [
    { name: "Inicio", href: "/dashboard", icon: Home },
    { name: "Pacientes", href: "/dashboard/patients", icon: Users },
    { name: "Informes", href: "/dashboard/history", icon: FolderOpen },
    { name: "Nuevo informe", href: "/dashboard/new-report", icon: FilePlus2 },
    { name: "Calendario", href: "/dashboard/calendar", icon: CalendarDays },
  ];

  const extraLinks = [{ name: "Videoconsulta", href: "/dashboard/video", icon: Video }];

  const adminLinks = [
    { name: "Auditoria", href: "/dashboard/audit", icon: History },
    { name: "Configuracion", href: "/dashboard/settings", icon: Settings },
    { name: "Papelera", href: "/dashboard/trash", icon: Trash2 },
  ];

  const renderLink = (link: { name: string; href: string; icon: ComponentType<{ className?: string }> }) => {
    const active = pathname === link.href;
    return (
      <Link
        key={link.name}
        href={link.href}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 font-semibold transition-all",
          active ? "bg-primary-light text-primary" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
          isCollapsed ? "justify-center" : "justify-start"
        )}
        title={link.name}
        onClick={() => setIsOpen(false)}
      >
        <link.icon className={cn("h-5 w-5 shrink-0", active ? "text-primary" : "")} />
        {!isCollapsed && <span className="truncate text-[14px]">{link.name}</span>}
      </Link>
    );
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-secondary-text/40 backdrop-blur-sm lg:hidden" onClick={() => setIsOpen(false)} />}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-secondary-border bg-white transition-all duration-300 transform lg:static",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "w-[76px]" : "w-[256px]"
        )}
      >
        <div className={cn("relative flex h-[72px] items-center border-b border-secondary-border shrink-0", isCollapsed ? "justify-center px-0" : "justify-between px-4")}>
          <Link href="/dashboard" className={cn("flex items-center gap-3 overflow-hidden transition-all", isCollapsed ? "w-full justify-center" : "")} onClick={() => setIsOpen(false)}>
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-primary shadow-md shrink-0">
              <Image src="/emotiva-logo.png" alt="Emotiva" width={36} height={36} className="object-contain" priority />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="whitespace-nowrap text-[15px] font-extrabold leading-tight tracking-tight text-secondary-text">Emotiva System</p>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Centro Psicologico</p>
              </div>
            )}
          </Link>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn("hidden shrink-0 text-slate-400 hover:text-slate-600 lg:flex", isCollapsed && "absolute -right-3 top-1/2 z-50 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-1 shadow-sm")}
            type="button"
            aria-label="Contraer menu"
          >
            <Menu className={cn("h-5 w-5", isCollapsed && "h-4 w-4 text-primary")} />
          </button>

          <button onClick={() => setIsOpen(false)} className={cn("shrink-0 text-slate-400 hover:text-slate-600 lg:hidden", isCollapsed && "hidden")} type="button" aria-label="Cerrar menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="custom-scrollbar flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {navLinks.map(renderLink)}

          <div className={cn("pt-4 pb-2", isCollapsed ? "px-0 text-center" : "px-2")}>
            <span className={cn("text-[10px] font-bold uppercase tracking-widest text-slate-400", isCollapsed && "hidden")}>Servicios</span>
            {isCollapsed && <div className="mx-auto h-[1px] w-6 bg-slate-200" />}
          </div>

          {extraLinks.map(renderLink)}

          <div className={cn("pt-4 pb-2", isCollapsed ? "px-0 text-center" : "px-2")}>
            <span className={cn("text-[10px] font-bold uppercase tracking-widest text-slate-400", isCollapsed && "hidden")}>Clinica</span>
            {isCollapsed && <div className="mx-auto h-[1px] w-6 bg-slate-200" />}
          </div>

          {adminLinks.map(renderLink)}
        </div>

        <div className={cn("shrink-0 border-t border-secondary-border p-3", isCollapsed ? "px-2" : "")}>
          <Link href="/dashboard/settings" className={cn("flex w-full items-center gap-3 rounded-xl p-2 transition-colors hover:bg-slate-50", isCollapsed ? "justify-center" : "")} onClick={() => setIsOpen(false)}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white bg-gradient-to-tr from-primary to-primary-dark text-sm font-bold text-white shadow-sm ring-2 ring-primary/20">
              {userInitials}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-bold text-secondary-text">{user?.name || "Usuario"}</p>
                <p className="truncate text-xs font-semibold tracking-tight text-primary">{user?.role === "ADMIN" ? "Administrador(a)" : "Especialista"}</p>
              </div>
            )}
          </Link>

          <button
            onClick={async () => {
              await logoutUser();
              router.replace("/");
              router.refresh();
            }}
            className={cn("group mt-1 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500", isCollapsed ? "p-3" : "")}
            type="button"
          >
            <LogOut className="h-4 w-4 transition-all" />
            {!isCollapsed && "Cerrar sesion"}
          </button>
        </div>
      </aside>
    </>
  );
}
