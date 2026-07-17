"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleDashed, PencilLine } from "lucide-react";
import { updateReportStatus } from "@/app/actions/reports";
import { useToast } from "@/components/ToastProvider";
import { useT } from "@/lib/useT";

const STATUS_OPTIONS = ["Borrador", "En revisión", "Completado"] as const;

export function ReportStatusSelector({
  reportId,
  initialStatus,
}: {
  reportId: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useT();
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();
  const STATUS_META: Record<
    (typeof STATUS_OPTIONS)[number],
    { label: string; icon: typeof CircleDashed; className: string }
  > = {
    Borrador: {
      label: "Borrador",
      icon: CircleDashed,
      className: "border-slate-200 bg-slate-50 text-slate-600",
    },
    "En revisión": {
      label: "En revisión",
      icon: PencilLine,
      className: "border-amber-200 bg-amber-50 text-amber-700",
    },
    Completado: {
      label: "Completado",
      icon: CheckCircle2,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
  };
  const meta = STATUS_META[(status as (typeof STATUS_OPTIONS)[number])] || STATUS_META["Borrador"];
  const Icon = meta.icon;

  const handleChange = (next: string) => {
    setStatus(next);
    startTransition(async () => {
      const res = await updateReportStatus(reportId, next);
      if (res.success) {
        toast({ type: "success", title: "Estado actualizado", description: next });
        router.refresh();
      } else {
        toast({ type: "error", title: "No se pudo actualizar el estado." });
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${meta.className}`}>
        <Icon className="h-3.5 w-3.5" /> {meta.label}
      </span>
      <select
        value={status}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value)}
        className="inp w-auto cursor-pointer rounded-full border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 disabled:opacity-60"
        aria-label={"Cambiar estado"}
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {"Estado:"} {option}
          </option>
        ))}
      </select>
    </div>
  );
}
