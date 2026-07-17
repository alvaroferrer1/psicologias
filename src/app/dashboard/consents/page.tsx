import { redirect } from "next/navigation";
import { requireEditableUser } from "@/lib/auth";
import { getConsentRecords } from "@/app/actions/consents";
import { ConsentInbox } from "@/components/ConsentInbox";
import { getServerT } from "@/lib/i18n-server";

const STATUS_STYLES: Record<string, string> = {
  pendiente: "bg-amber-50 text-amber-700 border-amber-200",
  firmado: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rechazado: "bg-red-50 text-red-700 border-red-200",
  revocado: "bg-slate-100 text-slate-600 border-slate-200",
};

export default async function ConsentsPage() {
  const { t, lang } = await getServerT();
  const user = await requireEditableUser();
  if (!user) redirect("/");
  const locale = lang === "en" ? "en-US" : "es-ES";

  const records = await getConsentRecords();

  const counts = {
    pendiente: records.filter((r) => r.status === "pendiente").length,
    firmado: records.filter((r) => r.status === "firmado").length,
    rechazado: records.filter((r) => r.status === "rechazado").length,
    revocado: records.filter((r) => r.status === "revocado").length,
  };

  const normalized = records.map((record) => ({
    id: record.id,
    patientId: record.patientId,
    patientName: record.patient?.name || t("patients.unassigned"),
    consentType: record.consentType,
    status: record.status,
    signedAt: record.signedAt ? record.signedAt.toLocaleString(locale) : null,
    createdAt: record.createdAt.toLocaleString(locale),
    notes: record.notes || null,
    statusStyle: STATUS_STYLES[record.status] || STATUS_STYLES.revocado,
    statusLabel: record.status,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-secondary-text md:text-3xl">
            {t("consents.title")}
          </h1>
          <p className="mt-1 font-medium text-slate-500">
            {t("consents.subtitle")}
          </p>
        </div>
      </div>

      <ConsentInbox initialRecords={normalized} counts={counts} />
    </div>
  );
}
