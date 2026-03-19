"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { logAudit, requireCurrentUser, requireEditableUser } from "@/lib/auth"
import { isValidEmail, isValidSpanishDni, normalizeDni, normalizeEmail } from "@/lib/validators"

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
    const user = await requireEditableUser()
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
    const user = await requireEditableUser()
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

export async function createPatient(data: {
  name: string
  email?: string
  phone?: string
  description?: string
  dni?: string
  birthDate?: string
  address?: string
  patientType?: string
  status?: string
  guardianName?: string
  guardianDni?: string
  guardianPhone?: string
  guardianEmail?: string
  clinicalAlerts?: string
}) {
  try {
    const user = await requireEditableUser()
    const activeColors = ["bg-blue-500", "bg-sky-500", "bg-indigo-500", "bg-cyan-500", "bg-blue-700"]
    const randomColor = activeColors[Math.floor(Math.random() * activeColors.length)]
    const status = data.status || "activo"
    const normalizedEmail = data.email ? normalizeEmail(data.email) : null
    const normalizedDni = data.dni ? normalizeDni(data.dni) : null
    const normalizedGuardianDni = data.guardianDni ? normalizeDni(data.guardianDni) : null

    if (normalizedEmail && !isValidEmail(normalizedEmail)) {
      return { success: false, error: "El email del paciente no es válido." }
    }

    if (!isValidSpanishDni(normalizedDni || "")) {
      return { success: false, error: "El DNI del paciente no es válido." }
    }

    if (!isValidSpanishDni(normalizedGuardianDni || "")) {
      return { success: false, error: "El DNI del apoderado no es válido." }
    }

    const patient = await prisma.patient.create({
      data: {
        userId: user.id,
        name: data.name,
        email: normalizedEmail,
        phone: data.phone || null,
        dni: normalizedDni,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        address: data.address || null,
        description: data.description || "Adultos",
        patientType: data.patientType || "adulto",
        status,
        guardianName: data.guardianName || null,
        guardianDni: normalizedGuardianDni,
        guardianPhone: data.guardianPhone || null,
        guardianEmail: data.guardianEmail ? normalizeEmail(data.guardianEmail) : null,
        clinicalAlerts: data.clinicalAlerts || null,
        color: randomColor,
        active: status === "activo",
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

export async function updatePatient(data: {
  id: string
  name: string
  email?: string
  phone?: string
  dni?: string
  birthDate?: string
  address?: string
  patientType?: string
  status?: string
  guardianName?: string
  guardianDni?: string
  guardianPhone?: string
  guardianEmail?: string
  clinicalAlerts?: string
}) {
  try {
    const user = await requireEditableUser()
    const patient = await getAccessiblePatient(data.id, user.id)

    if (!patient) {
      return { success: false, error: "Paciente no encontrado." }
    }

    const normalizedEmail = data.email ? normalizeEmail(data.email) : null
    const normalizedGuardianEmail = data.guardianEmail ? normalizeEmail(data.guardianEmail) : null
    const normalizedDni = data.dni ? normalizeDni(data.dni) : null
    const normalizedGuardianDni = data.guardianDni ? normalizeDni(data.guardianDni) : null
    const normalizedStatus = ["activo", "pausa", "pasivo"].includes(data.status || "") ? data.status : patient.status

    if (normalizedEmail && !isValidEmail(normalizedEmail)) {
      return { success: false, error: "El email del paciente no es válido." }
    }

    if (normalizedGuardianEmail && !isValidEmail(normalizedGuardianEmail)) {
      return { success: false, error: "El email del apoderado no es válido." }
    }

    if (!isValidSpanishDni(normalizedDni || "")) {
      return { success: false, error: "El DNI del paciente no es válido." }
    }

    if (!isValidSpanishDni(normalizedGuardianDni || "")) {
      return { success: false, error: "El DNI del apoderado no es válido." }
    }

    await prisma.patient.update({
      where: { id: patient.id },
      data: {
        name: data.name,
        email: normalizedEmail,
        phone: data.phone || null,
        dni: normalizedDni,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        address: data.address || null,
        description: data.patientType === "infantil" ? "Niños" : data.patientType === "adolescente" ? "Adolescentes" : data.patientType === "pareja" ? "Parejas" : data.patientType === "familia" ? "Familia" : "Adultos",
        patientType: data.patientType || patient.patientType,
        status: normalizedStatus || patient.status,
        active: (normalizedStatus || patient.status) === "activo",
        guardianName: data.guardianName || null,
        guardianDni: normalizedGuardianDni,
        guardianPhone: data.guardianPhone || null,
        guardianEmail: normalizedGuardianEmail,
        clinicalAlerts: data.clinicalAlerts || null,
      },
    })

    await logAudit({
      userId: user.id,
      action: "patient.update",
      entityType: "patient",
      entityId: patient.id,
    })

    revalidatePath("/dashboard/patients")
    revalidatePath(`/dashboard/patients/${patient.id}`)
    revalidatePath(`/dashboard/patients/${patient.id}/history`)
    return { success: true }
  } catch (error) {
    console.error("Error updating patient:", error)
    return { success: false, error: "No se pudo actualizar la ficha del paciente." }
  }
}

export async function updatePatientStatus(patientId: string, status: string) {
  try {
    const user = await requireEditableUser()
    const patient = await getAccessiblePatient(patientId, user.id)

    if (!patient) {
      return { success: false, error: "Paciente no encontrado." }
    }

    const normalizedStatus = ["activo", "pausa", "pasivo"].includes(status) ? status : "activo"

    await prisma.patient.update({
      where: { id: patient.id },
      data: {
        status: normalizedStatus,
        active: normalizedStatus === "activo",
      },
    })

    await logAudit({
      userId: user.id,
      action: "patient.status_update",
      entityType: "patient",
      entityId: patient.id,
      metadata: { status: normalizedStatus },
    })

    revalidatePath("/dashboard/patients")
    revalidatePath(`/dashboard/patients/${patient.id}`)
    revalidatePath(`/dashboard/patients/${patient.id}/history`)
    return { success: true }
  } catch (error) {
    console.error("Error updating patient status:", error)
    return { success: false, error: "No se pudo actualizar el estado." }
  }
}

export async function archivePatient(patientId: string) {
  try {
    const user = await requireEditableUser()
    const patient = await getAccessiblePatient(patientId, user.id)

    if (!patient) {
      return { success: false, error: "Paciente no encontrado." }
    }

    await prisma.patient.update({
      where: { id: patient.id },
      data: {
        active: false,
        status: "pasivo",
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
    const user = await requireEditableUser()
    const patient = await getAccessiblePatient(patientId, user.id, true)

    if (!patient || !patient.deletedAt) {
      return { success: false, error: "Paciente no encontrado en la papelera." }
    }

    await prisma.patient.update({
      where: { id: patient.id },
      data: {
        active: true,
        status: "activo",
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
    const user = await requireEditableUser()
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
  storagePath?: string
  fileName?: string
  mimeType?: string
  sizeBytes?: number
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
        storagePath: data.storagePath || null,
        fileName: data.fileName || null,
        mimeType: data.mimeType || null,
        sizeBytes: data.sizeBytes || null,
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
