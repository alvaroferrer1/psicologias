"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logAudit, requireEditableUser } from "@/lib/auth";

const VALID_STATUSES = ["pendiente", "firmado", "rechazado", "revocado"];

export async function getConsentRecords() {
  try {
    const user = await requireEditableUser();
    const records = await prisma.consentRecord.findMany({
      where: {
        OR: [{ userId: user.id }, { userId: null }],
      },
      include: {
        patient: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return records;
  } catch (error) {
    console.error("Error fetching consents:", error);
    return [];
  }
}

export async function signConsentRecord(consentId: string) {
  try {
    const user = await requireEditableUser();
    const consent = await prisma.consentRecord.findFirst({
      where: { id: consentId, OR: [{ userId: user.id }, { userId: null }] },
      include: { patient: { select: { id: true, name: true } } },
    });

    if (!consent) {
      return { success: false, error: "Consentimiento no encontrado." };
    }

    await prisma.consentRecord.update({
      where: { id: consent.id },
      data: { status: "firmado", signedAt: new Date() },
    });

    await logAudit({
      userId: user.id,
      action: "consent.sign",
      entityType: "consent_record",
      entityId: consent.id,
      metadata: { patientId: consent.patientId, consentType: consent.consentType },
    });

    revalidatePath("/dashboard/consents");
    revalidatePath(`/dashboard/patients/${consent.patientId}`);
    revalidatePath(`/dashboard/patients/${consent.patientId}/history`);
    return { success: true };
  } catch (error) {
    console.error("Error signing consent:", error);
    return { success: false, error: "No se pudo firmar el consentimiento." };
  }
}

export async function rejectConsentRecord(consentId: string, reason?: string) {
  try {
    const user = await requireEditableUser();
    const consent = await prisma.consentRecord.findFirst({
      where: { id: consentId, OR: [{ userId: user.id }, { userId: null }] },
      include: { patient: { select: { id: true, name: true } } },
    });

    if (!consent) {
      return { success: false, error: "Consentimiento no encontrado." };
    }

    await prisma.consentRecord.update({
      where: { id: consent.id },
      data: {
        status: "rechazado",
        notes: reason ? `Rechazado: ${reason}` : "Rechazado por el profesional.",
      },
    });

    await logAudit({
      userId: user.id,
      action: "consent.reject",
      entityType: "consent_record",
      entityId: consent.id,
      metadata: { patientId: consent.patientId, consentType: consent.consentType },
    });

    revalidatePath("/dashboard/consents");
    revalidatePath(`/dashboard/patients/${consent.patientId}`);
    revalidatePath(`/dashboard/patients/${consent.patientId}/history`);
    return { success: true };
  } catch (error) {
    console.error("Error rejecting consent:", error);
    return { success: false, error: "No se pudo rechazar el consentimiento." };
  }
}

export async function resendConsentRecord(consentId: string) {
  try {
    const user = await requireEditableUser();
    const consent = await prisma.consentRecord.findFirst({
      where: { id: consentId, OR: [{ userId: user.id }, { userId: null }] },
      include: { patient: { select: { id: true, name: true, email: true } } },
    });

    if (!consent) {
      return { success: false, error: "Consentimiento no encontrado." };
    }

    await prisma.consentRecord.update({
      where: { id: consent.id },
      data: { status: "pendiente", signedAt: null },
    });

    await logAudit({
      userId: user.id,
      action: "consent.resend",
      entityType: "consent_record",
      entityId: consent.id,
      metadata: { patientId: consent.patientId, consentType: consent.consentType, patientEmail: consent.patient.email },
    });

    revalidatePath("/dashboard/consents");
    revalidatePath(`/dashboard/patients/${consent.patientId}`);
    revalidatePath(`/dashboard/patients/${consent.patientId}/history`);
    return { success: true, patientEmail: consent.patient.email };
  } catch (error) {
    console.error("Error resending consent:", error);
    return { success: false, error: "No se pudo reenviar el consentimiento." };
  }
}

export async function createVideoConsent(data: { patientId: string; roomName: string }) {
  try {
    const user = await requireEditableUser();
    const patient = await prisma.patient.findFirst({
      where: {
        id: data.patientId,
        deletedAt: null,
        OR: [{ userId: user.id }, { userId: null }],
      },
    });

    if (!patient) {
      return { success: false, error: "Paciente no encontrado." };
    }

    const consent = await prisma.consentRecord.create({
      data: {
        patientId: patient.id,
        userId: user.id,
        consentType: "videoconsulta",
        status: "firmado",
        signedAt: new Date(),
        notes: `Consentimiento de videoconsulta firmado en sala ${data.roomName}.`,
      },
    });

    await logAudit({
      userId: user.id,
      action: "consent.video_sign",
      entityType: "consent_record",
      entityId: consent.id,
      metadata: { patientId: patient.id, roomName: data.roomName },
    });

    revalidatePath(`/dashboard/patients/${patient.id}`);
    revalidatePath(`/dashboard/patients/${patient.id}/history`);
    return { success: true };
  } catch (error) {
    console.error("Error creating video consent:", error);
    return { success: false, error: "No se pudo registrar el consentimiento de vídeo." };
  }
}
