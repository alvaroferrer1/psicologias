"use client";

import { useState, useTransition } from "react";
import { Check, RefreshCw, X, FileSignature, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";
import { useT } from "@/lib/useT";
import {
  resendConsentRecord,
  rejectConsentRecord,
  signConsentRecord,
} from "@/app/actions/consents";

export type ConsentRecordView = {
  id: string;
  patientId: string;
  patientName: string;
  consentType: string;
  status: string;
  signedAt: string | null;
  createdAt: string;
  notes: string | null;
  statusStyle: string;
  statusLabel: string;
};

export function ConsentInbox({ initialRecords, counts }: { initialRecords: ConsentRecordView[]; counts?: { pendiente: number; firmado: number; rechazado: number; revocado: number } }) {
  const { t, lang } = useT();
  const locale = lang === "en" ? "en-US" : "es-ES";
  const { toast } = useToast();
  const [records, setRecords] = useState<ConsentRecordView[]>(initialRecords);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const CONSENT_TYPE_LABELS: Record<string, string> = {
    informado: "Consentimiento informado",
    tratamiento: "Tratamiento",
    imagen: "Imagen",
    videoconsulta: "Videoconsulta",
    menor: "Menor",
    default: "Otro",
  };

  function updateRecord(id: string, patch: Partial<ConsentRecordView>) {
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function runAction(
    id: string,
    action: (id: string) => Promise<{ success: boolean; error?: string }>,
    onSuccess: (rec: ConsentRecordView) => Partial<ConsentRecordView>,
    successMessage: string
  ) {
    setPendingId(id);
    startTransition(async () => {
      const result = await action(id);
      setPendingId(null);
      if (!result.success) {
        toast({ type: "error", title: "Error al procesar el consentimiento", description: result.error });
        return;
      }
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...onSuccess(r) } : r))
      );
      toast({ type: "success", title: successMessage });
    });
  }

  if (records.length === 0) {
    return (
      <div className="card p-10 text-center">
        <FileSignature className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 font-semibold text-secondary-text">{"Aún no hay consentimientos."}</p>
        <p className="mt-1 text-sm text-slate-500">
          {"Cuando un paciente firme un consentimiento, aparecerá aquí para su seguimiento."}
        </p>
      </div>
    );
  }

  const pending = records.filter((r) => r.status === "pendiente").length;

  const summary = counts
    ? [
        { label: "Pendientes", value: counts.pendiente, tone: "text-amber-600" },
        { label: "Firmados", value: counts.firmado, tone: "text-emerald-600" },
        { label: "Rechazados", value: counts.rechazado, tone: "text-red-600" },
        { label: "Revocados", value: counts.revocado, tone: "text-slate-500" },
      ]
    : null;

  return (
    <div className="space-y-4">
      {summary && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {summary.map((stat) => (
            <div key={stat.label} className="card p-4 text-center">
              <p className={`text-2xl font-black ${stat.tone}`}>{stat.value}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {pending > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          {"Tienes"} {pending} {"consentimiento"}{pending === 1 ? "" : "s"} {"pendiente"}{pending === 1 ? "" : "s"} {"por firmar"}.
        </div>
      )}

      <div className="grid gap-4">
        {records.map((record) => (
          <div key={record.id} className="card p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-secondary-text">
                    {CONSENT_TYPE_LABELS[record.consentType] || CONSENT_TYPE_LABELS.default}
                  </h3>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${record.statusStyle}`}>
                    {record.statusLabel}
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  {"Paciente:"}{" "}
                  <Link href={`/dashboard/patients/${record.patientId}`} className="font-semibold text-primary hover:underline">
                    {record.patientName}
                  </Link>
                </p>
                <p className="text-xs text-slate-400">
                  {"Creado"} {record.createdAt}
                  {record.signedAt ? ` · ${"Firmado"}: ${new Date(record.signedAt).toLocaleString(locale)}` : ""}
                </p>
                {record.notes && <p className="text-xs text-slate-400">{"Notas:"} {record.notes}</p>}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {record.status !== "firmado" && (
                  <button
                    type="button"
                    disabled={isPending && pendingId === record.id}
                    onClick={() =>
                      runAction(
                        record.id,
                        signConsentRecord,
                        () => ({ status: "firmado", statusLabel: "Firmado", signedAt: new Date().toLocaleString("es-ES"), statusStyle: "bg-emerald-50 text-emerald-700 border-emerald-200" }),
                        "Consentimiento firmado."
                      )
                    }
                    className="btn btn-primary btn-sm"
                  >
                    {pendingId === record.id && isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Firmar
                  </button>
                )}

                {record.status !== "pendiente" && (
                  <button
                    type="button"
                    disabled={isPending && pendingId === record.id}
                    onClick={() =>
                      runAction(
                        record.id,
                        resendConsentRecord,
                        () => ({ status: "pendiente", statusLabel: "Pendiente", signedAt: null, statusStyle: "bg-amber-50 text-amber-700 border-amber-200" }),
                        "Consentimiento marcado como pendiente."
                      )
                    }
                    className="btn btn-secondary btn-sm"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reenviar
                  </button>
                )}

                {record.status !== "rechazado" && (
                  <button
                    type="button"
                    disabled={isPending && pendingId === record.id}
                    onClick={() =>
                      runAction(
                        record.id,
                        rejectConsentRecord,
                        () => ({ status: "rechazado", statusLabel:                         "Rechazado", statusStyle: "bg-red-50 text-red-700 border-red-200" }),
                        "Consentimiento rechazado."
                      )
                    }
                    className="btn btn-danger btn-sm"
                  >
                    <X className="h-4 w-4" />
                    {"Rechazar"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
