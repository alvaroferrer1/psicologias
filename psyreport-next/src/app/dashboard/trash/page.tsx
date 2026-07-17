import { Trash2 } from "lucide-react";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TrashPatientsClient } from "@/components/TrashPatientsClient";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function TrashPage() {
  const { t } = await getServerT();
  const user = await requireCurrentUser();
  const patients = await prisma.patient.findMany({
    where: {
      deletedAt: { not: null },
      OR: [{ userId: user.id }, { userId: null }],
    },
    orderBy: { deletedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-[#fbfcfb] to-[#f4f7f6] p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <Trash2 className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-secondary-text md:text-3xl">{t("trash.title")}</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">{t("trash.subtitle")}</p>
          </div>
        </div>
      </div>

      <TrashPatientsClient
        patients={patients.map((patient) => ({
          id: patient.id,
          name: patient.name,
          description: patient.description,
          deletedAt: patient.deletedAt?.toISOString() || new Date().toISOString(),
        }))}
      />
    </div>
  );
}
