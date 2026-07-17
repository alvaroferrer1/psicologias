"use client";

import Image from "next/image";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import TopbarSearch from "@/components/TopbarSearch";
import { TopbarNotifications } from "@/components/TopbarNotifications";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useT } from "@/lib/useT";

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
  const { t } = useT();

  const getPageTitle = () => {
    if (pathname === "/dashboard") return t("nav.home");
    if (pathname.includes("search")) return t("nav.search");
    if (pathname.includes("new-report")) return t("nav.newReport");
    if (pathname.includes("history")) return t("nav.history");
    if (pathname.includes("patients")) return t("nav.patients");
    if (pathname.includes("audit")) return t("nav.audit");
    if (pathname.includes("db-guide")) return t("nav.database");
    if (pathname.includes("settings")) return t("nav.settings");
    if (pathname.includes("calendar")) return t("nav.calendar");
    return t("nav.dashboard");
  };

  return (
    <div className="sticky top-0 z-30 flex h-[73px] items-center justify-between border-b border-secondary-border bg-white px-4 pb-[1px] shadow-nav md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          className="p-1 text-slate-500 hover:text-slate-800 lg:hidden"
          type="button"
          onClick={() => window.dispatchEvent(new Event("sidebar:toggle"))}
          aria-label={t("nav.openMenu")}
        >
          <Menu className="h-[22px] w-[22px]" />
        </button>
        <h1 className="hidden text-[18px] font-extrabold tracking-tight text-secondary-text sm:block">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-4">
        <TopbarSearch />
        <ThemeToggle />
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
