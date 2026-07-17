import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { PatientWorkspace } from "@/components/PatientWorkspace";
import { getServerT } from "@/lib/i18n-server";

export default async function PatientHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t } = await getServerT();
  const user = await requireCurrentUser();
  const { id } = await params;

  const patient = await prisma.patient.findFirst({
    where: {
      id,
      OR: [{ userId: user.id }, { userId: null }],
    },
    include: {
      reports: {
        where: { deletedAt: null },
        include: { versions: true },
        orderBy: { updatedAt: "desc" },
      },
      appointments: {
        where: { deletedAt: null },
        orderBy: { date: "desc" },
      },
      notes: {
        orderBy: { createdAt: "desc" },
      },
      documents: {
        orderBy: { createdAt: "desc" },
      },
      consents: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!patient) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/patients/${patient.id}`} className="btn btn-ghost btn-icon rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-secondary-text md:text-3xl">{t("Historial de informes")}</h1>
          <p className="text-sm font-medium text-slate-500">{patient.name} Â· {t("Historial")}</p>
        </div>
      </div>

      <PatientWorkspace
        patient={{
          id: patient.id,
          name: patient.name,
          description: patient.description,
          email: patient.email,
          phone: patient.phone,
          archived: Boolean(patient.deletedAt),
        }}
        reports={patient.reports.map((report) => ({
          id: report.id,
          title: report.title,
          type: report.type,
          status: report.status,
          updatedAt: report.updatedAt.toISOString(),
          versions: report.versions.length,
        }))}
        appointments={patient.appointments.map((appointment) => ({
          id: appointment.id,
          title: appointment.title,
          type: appointment.type,
          status: appointment.status,
          date: appointment.date.toISOString(),
          videoUrl: appointment.meetingUrl,
        }))}
        notes={patient.notes.map((note) => ({
          id: note.id,
          title: note.title,
          content: note.content,
          sessionDate: note.sessionDate?.toISOString() || null,
          createdAt: note.createdAt.toISOString(),
        }))}
        documents={patient.documents.map((document) => ({
          id: document.id,
          title: document.title,
          documentType: document.documentType,
          url: document.url,
          fileName: document.fileName,
          mimeType: document.mimeType,
          sizeBytes: document.sizeBytes,
          notes: document.notes,
          createdAt: document.createdAt.toISOString(),
        }))}
        consents={patient.consents.map((consent) => ({
          id: consent.id,
          consentType: consent.consentType,
          status: consent.status,
          signedAt: consent.signedAt?.toISOString() || null,
          notes: consent.notes,
          createdAt: consent.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
