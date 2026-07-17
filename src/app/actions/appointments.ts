"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { logAudit, requireCurrentUser, requireEditableUser } from "@/lib/auth"

export async function getAppointments() {
  try {
    const user = await requireEditableUser()
    const appointments = await prisma.appointment.findMany({
      where: {
        deletedAt: null,
        OR: [
          { userId: user.id },
          { userId: null },
        ],
      },
      include: { patient: true },
      orderBy: { date: 'asc' }
    })
    return appointments
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return []
  }
}

export async function createAppointment(data: { patientId: string, title: string, type: string, date: Date }) {
  try {
    const user = await requireEditableUser()
    const patient = await prisma.patient.findFirst({
      where: {
        id: data.patientId,
        deletedAt: null,
        OR: [
          { userId: user.id },
          { userId: null },
        ],
      },
    })

    if (!patient) {
      return { success: false, error: "No tienes acceso a ese paciente." }
    }

    const appointment = await prisma.appointment.create({
      data: {
        userId: user.id,
        title: data.title,
        patientId: data.patientId,
        type: data.type || "Presencial",
        provider: data.type === "Videoconsulta" ? "jitsi" : null,
        date: data.date
      }
    })

    await logAudit({
      userId: user.id,
      action: "appointment.create",
      entityType: "appointment",
      entityId: appointment.id,
      metadata: { patientId: patient.id, type: appointment.type },
    })
    
    revalidatePath("/dashboard/calendar")
    return { success: true }
  } catch (error) {
    console.error("Error creating appointment:", error)
    return { success: false, error: "No se pudo agendar la cita." }
  }
}

export async function deleteAppointment(id: string) {
  try {
    const user = await requireEditableUser()
    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        deletedAt: null,
        OR: [{ userId: user.id }, { userId: null }],
      },
    })

    if (!appointment) {
      return { success: false, error: "Cita no encontrada." }
    }

    await prisma.appointment.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    await logAudit({
      userId: user.id,
      action: "appointment.delete",
      entityType: "appointment",
      entityId: id,
      metadata: { patientId: appointment.patientId, type: appointment.type },
    })

    revalidatePath("/dashboard/calendar")
    return { success: true }
  } catch (error) {
    console.error("Error deleting appointment:", error)
    return { success: false, error: "No se pudo eliminar la cita." }
  }
}

export async function getOrCreateVideoMeeting(appointmentId: string) {
  try {
    const user = await requireCurrentUser()
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        deletedAt: null,
        OR: [{ userId: user.id }, { userId: null }],
      },
      include: { patient: true },
    })

    if (!appointment) {
      return { success: false, error: "Cita no encontrada." }
    }

    const roomName = appointment.roomName || `Emotiva-${appointment.id.slice(0, 8)}`
    const roomPassword = (appointment as { roomPassword?: string | null }).roomPassword || undefined
    const meetingUrl = appointment.meetingUrl || `https://meet.jit.si/${roomName}`

    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        userId: user.id,
        type: "Videoconsulta",
        provider: appointment.provider || "jitsi",
        roomName,
        meetingUrl,
      },
    })

    await logAudit({
      userId: user.id,
      action: "appointment.video.open",
      entityType: "appointment",
      entityId: updated.id,
      metadata: { roomName, meetingUrl },
    })

    return { success: true, appointment: { ...updated, roomPassword } }
  } catch (error) {
    console.error("Error creating video meeting:", error)
    return { success: false, error: "No se pudo preparar la videoconsulta." }
  }
}
