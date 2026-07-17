import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { translate } from "@/lib/i18n";

export function SettingsShell({
  title,
  description,
  children,
  backHref = "/dashboard/settings",
  icon,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  backHref?: string;
  icon?: ReactNode;
}) {
  const t = (k: string) => translate("es", k);
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> {"Volver"}
      </Link>

      <div className="flex items-center gap-4">
        {icon && (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-light text-primary shadow-sm">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-secondary-text md:text-3xl">{title}</h1>
          {description && <p className="mt-1 font-medium text-slate-500">{description}</p>}
        </div>
      </div>

      {children}
    </div>
  );
}
