"use client";

import Link from "next/link";
import { Bell, CalendarClock, Gift, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useT } from "@/lib/useT";

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  href?: string;
  kind?: "appointment" | "birthday" | "clinical";
};

const KIND_STYLES: Record<NonNullable<NotificationItem["kind"]>, { icon: React.ReactNode; ring: string; bg: string }> = {
  appointment: { icon: <CalendarClock className="h-4 w-4" />, ring: "bg-primary-light text-primary", bg: "hover:bg-primary-light/60" },
  birthday: { icon: <Gift className="h-4 w-4" />, ring: "bg-amber-50 text-amber-600", bg: "hover:bg-amber-50" },
  clinical: { icon: <AlertTriangle className="h-4 w-4" />, ring: "bg-rose-50 text-rose-600", bg: "hover:bg-rose-50" },
};

export function TopbarNotifications({ items }: { items: NotificationItem[] }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const count = items.length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:text-primary dark:border-secondary-border dark:bg-[var(--color-secondary-card)]"
        aria-label={"Notificaciones"}
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-40 w-[350px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-secondary-border dark:bg-[var(--color-secondary-card)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-secondary-border">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">{"Notificaciones"}</p>
            {count > 0 && (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-600">
                {count} {"nueva"}{count === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <div className="max-h-[380px] space-y-2 overflow-y-auto p-3">
            {count === 0 ? (
              <div className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500 dark:bg-slate-800/40">
                {"No tienes notificaciones."}
              </div>
            ) : (
              items.map((item) => {
                const style = KIND_STYLES[item.kind || "appointment"];
                const content = (
                  <div className={`flex items-start gap-3 rounded-xl bg-slate-50 p-3 transition-colors dark:bg-slate-800/40 ${style.bg}`}>
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style.ring}`}>{style.icon}</div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-secondary-text">{item.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
                    </div>
                  </div>
                );
                return item.href ? (
                  <Link key={item.id} href={item.href} onClick={() => setOpen(false)}>
                    {content}
                  </Link>
                ) : (
                  <div key={item.id}>{content}</div>
                );
              })
            )}
          </div>
          <Link
            href="/dashboard/settings/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-slate-100 px-4 py-3 text-center text-xs font-bold text-primary hover:underline dark:border-secondary-border"
          >
            {"Ver todas"}
          </Link>
        </div>
      )}
    </div>
  );
}
