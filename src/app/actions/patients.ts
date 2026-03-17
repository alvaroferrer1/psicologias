"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { logAudit, requireCurrentUser } from "@/lib/auth"

async function getAccessiblePatient(patientId: string, userId: string, includeDeleted = false) {
  return prisma.patient.findFirst({
    where: {
      id: patientId,
      ...(includeDeleted ? {} : { deletedAt: null }),
      OR: [{ userId: userId }, { userId: null }],
    },
  })
}

export async function getPatients() {
  try {
    const user = await requireCurrentUser()
    const patients = await prisma.patient.findMany({
      where: {
        deletedAt: null,
        OR: [{ userId: user.id }, { userId: null }],
      },
      orderBy: { createdAt: "desc" },
    })
    return patients
  } catch (error) {
    console.error("Error fetching patients:", error)
    return []
  }
}

export async function getArchivedPatients() {
  try {
    const user = await requireCurrentUser()
    return await prisma.patient.findMany({
      where: {
        deletedAt: { not: null },
        OR: [{ userId: user.id }, { userId: null }],
      },
      orderBy: { deletedAt: "desc" },
    })
  } catch (error) {
    console.error("Error fetching archived patients:", error)
    return []
  }
}

export async function createPatient(data: { name: string; email?: string; phone?: string; description?: string }) {
  try {
    const user = await requireCurrentUser()
    const activeColors = ["bg-emerald-500", "bg-blue-500", "bg-indigo-500", "bg-purple-500", "bg-orange-500"]
    const randomColor = activeColors[Math.floor(Math.random() * activeColors.length)]

    const patient = await prisma.patient.create({
      data: {
        userId: user.id,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        description: data.description || "Adulto",
        color: randomColor,
        active: true,
      },
    })

    await logAudit({
      userId: user.id,
      action: "patient.create",
      entityType: "patient",
      entityId: patient.id,
      metadata: { name: patient.name },
    })

    revalidatePath("/dashboard/patients")
    return { success: true }
  } catch (error) {
    console.error("Error creating patient:", error)
    return { success: false, error: "No se pudo guardar." }
  }
}

export async function archivePatient(patientId: string) {
  try {
    const user = await requireCurrentUser()
    const patient = await getAccessiblePatient(patientId, user.id)

    if (!patient) {
      return { success: false, error: "Paciente no encontrado." }
    }

    await prisma.patient.update({
      where: { id: patient.id },
      data: {
        active: false,
        deletedAt: new Date(),
        deletedByUserId: user.id,
      },
    })

    await logAudit({
      userId: user.id,
      action: "patient.archive",
      entityType: "patient",
      entityId: patient.id,
      metadata: { name: patient.name },
    })

    revalidatePath("/dashboard/patients")
    revalidatePath("/dashboard/trash")
    return { success: true }
  } catch (error) {
    console.error("Error archiving patient:", error)
    return { success: false, error: "No se pudo archivar." }
  }
}

export async function restorePatient(patientId: string) {
  try {
    const user = await requireCurrentUser()
    const patient = await getAccessiblePatient(patientId, user.id, true)

    if (!patient || !patient.deletedAt) {
      return { success: false, error: "Paciente no encontrado en la papelera." }
    }

    await prisma.patient.update({
      where: { id: patient.id },
      data: {
        active: true,
        deletedAt: null,
        deletedByUserId: null,
      },
    })

    await logAudit({
      userId: user.id,
      action: "patient.restore",
      entityType: "patient",
      entityId: patient.id,
      metadata: { name: patient.name },
    })

    revalidatePath("/dashboard/patients")
    revalidatePath("/dashboard/trash")
    return { success: true }
  } catch (error) {
    console.error("Error restoring patient:", error)
    return { success: false, error: "No se pudo restaurar." }
  }
}

export async function addPatientNote(data: { patientId: string; title: string; content: string; sessionDate?: string }) {
  try {
    const user = await requireCurrentUser()
    const patient = await getAccessiblePatient(data.patientId, user.id)

    if (!patient) {
      return { success: false, error: "Paciente no encontrado." }
    }

    const note = await prisma.patientNote.create({
      data: {
        patientId: patient.id,
        userId: user.id,
        title: data.title,
        content: data.content,
        sessionDate: data.sessionDate ? new Date(data.sessionDate) : null,
      },
    })

    await logAudit({
      userId: user.id,
      action: "patient_note.create",
      entityType: "patient_note",
      entityId: note.id,
      metadata: { patientId: patient.id },
    })

    revalidatePath(`/dashboard/patients/${patient.id}`)
    revalidatePath(`/dashboard/patients/${patient.id}/history`)
    return { success: true }
  } catch (error) {
    console.error("Error creating patient note:", error)
    return { success: false, error: "No se pudo guardar la nota." }
  }
}

export async function addPatientDocument(data: {
  patientId: string
  title: string
  documentType: string
  url?: string
  notes?: string
}) {
  try {
    const user = await requireCurrentUser()
    const patient = await getAccessiblePatient(data.patientId, user.id)

    if (!patient) {
      return { success: false, error: "Paciente no encontrado." }
    }

    const document = await prisma.patientDocument.create({
      data: {
        patientId: patient.id,
        userId: user.id,
        title: data.title,
        documentType: data.documentType,
        url: data.url || null,
        notes: data.notes || null,
      },
    })

    await logAudit({
      userId: user.id,
      action: "patient_document.create",
      entityType: "patient_document",
      entityId: document.id,
      metadata: { patientId: patient.id, documentType: data.documentType },
    })

    revalidatePath(`/dashboard/patients/${patient.id}`)
    revalidatePath(`/dashboard/patients/${patient.id}/history`)
    return { success: true }
  } catch (error) {
    console.error("Error creating patient document:", error)
    return { success: false, error: "No se pudo guardar el documento." }
  }
}

export async function addConsentRecord(data: {
  patientId: string
  consentType: string
  status: string
  signedAt?: string
  notes?: string
}) {
  try {
    const user = await requireCurrentUser()
    const patient = await getAccessiblePatient(data.patientId, user.id)

    if (!patient) {
      return { success: false, error: "Paciente no encontrado." }
    }

    const consent = await prisma.consentRecord.create({
      data: {
        patientId: patient.id,
        userId: user.id,
        consentType: data.consentType,
        status: data.status,
        signedAt: data.signedAt ? new Date(data.signedAt) : null,
        notes: data.notes || null,
      },
    })

    await logAudit({
      userId: user.id,
      action: "consent.create",
      entityType: "consent_record",
      entityId: consent.id,
      metadata: { patientId: patient.id, consentType: data.consentType, status: data.status },
    })

    revalidatePath(`/dashboard/patients/${patient.id}`)
    revalidatePath(`/dashboard/patients/${patient.id}/history`)
    return { success: true }
  } catch (error) {
    console.error("Error creating consent:", error)
    return { success: false, error: "No se pudo guardar el consentimiento." }
  }
}
