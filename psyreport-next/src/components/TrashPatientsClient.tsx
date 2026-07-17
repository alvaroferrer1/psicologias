"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { RotateCcw, Trash2 } from "lucide-react";
import { restorePatient } from "@/app/actions/patients";
import { useToast } from "@/components/ToastProvider";
import { useT } from "@/lib/useT";

type ArchivedPatient = {
  id: string;
  name: string;
  description?: string | null;
  deletedAt: string;
};

export function TrashPatientsClient({ patients }: { patients: ArchivedPatient[] }) {
  const { t, lang } = useT();
  const locale = lang === "en" ? "en-US" : "es-ES";
  const { toast } = useToast();
  const [items, setItems] = useState(patients);
  const [isPending, startTransition] = useTransition();

  const handleRestore = (patientId: string) => {
    startTransition(async () => {
      const res = await restorePatient(patientId);
      if (!res.success) {
        toast({ type: "error", title: res.error || "No se pudo restaurar el paciente." });
        return;
      }
      setItems((prev) => prev.filter((patient) => patient.id !== patientId));
      toast({ type: "success", title: "Paciente restaurado." });
    });
  };

  if (items.length === 0) {
    return <div className="card p-10 text-center text-sm font-medium text-slate-500">{"La papelera está vacía."}</div>;
  }

  return (
    <div className="space-y-4">
      {items.map((patient) => (
        <div key={patient.id} className="card flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-red-500" />
              <p className="truncate font-bold text-secondary-text">{patient.name}</p>
            </div>
            <p className="mt-1 text-sm text-slate-500">{patient.description || "Sin descripción"}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {"Eliminado el"} {new Date(patient.deletedAt).toLocaleString(locale)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/dashboard/patients/${patient.id}/history`} className="btn btn-secondary">
              {"Ver historial"}
            </Link>
            <button type="button" onClick={() => handleRestore(patient.id)} disabled={isPending} className="btn btn-primary">
              <RotateCcw className="h-4 w-4" /> {"Restaurar"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
