"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useState } from "react";

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  href?: string;
};

export function TopbarNotifications({ items }: { items: NotificationItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((prev) => !prev)} className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-primary">
        <Bell className="h-5 w-5" />
        {items.length > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white">{items.length}</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-40 w-[340px] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
          <p className="px-2 pb-2 text-xs font-black uppercase tracking-widest text-slate-400">Notificaciones</p>
          <div className="space-y-2">
            {items.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">Sin alertas por ahora.</div>
            ) : items.map((item) => {
              const content = (
                <div className="rounded-xl bg-slate-50 p-3 transition-colors hover:bg-blue-50">
                  <p className="text-sm font-bold text-secondary-text">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                </div>
              );
              return item.href ? <Link key={item.id} href={item.href} onClick={() => setOpen(false)}>{content}</Link> : <div key={item.id}>{content}</div>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
