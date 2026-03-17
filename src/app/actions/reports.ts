"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { logAudit, requireCurrentUser } from "@/lib/auth"

export async function generateAIReport(patientId: string, type: string) {
  try {
    const user = await requireCurrentUser()
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        deletedAt: null,
        OR: [{ userId: user.id }, { userId: null }],
      },
    })

    const patientName = patient ? patient.name : "Paciente sin identificar"
    const today = new Date().toISOString().slice(0, 10)
    const generatedContent = JSON.stringify({
      prof_fecha: today,
      pac_nombre: patientName,
      consult_motivo: `Borrador inicial de ${type.toLowerCase()} pendiente de completar por la profesional responsable.`,
      eval_resumen: `Se ha generado una estructura base para ${patientName}. Este contenido debe revisarse, ampliarse y validarse antes de finalizar el informe.`,
      hall_hallazgos: "Pendiente de valoracion clinica.",
      hall_plan: "Pendiente de definir plan de intervencion.",
      concl_conclusiones: "Borrador clinico pendiente de revision.",
      concl_recomendaciones: "Completar tras la evaluacion profesional.",
      consentimiento: false,
    })

    const report = await prisma.report.create({
      data: {
        userId: user.id,
        title: `Informe ${type} - ${new Date().toLocaleDateString()}`,
        type,
        status: "Borrador",
        content: generatedContent,
        patientId,
      },
    })

    await logAudit({
      userId: user.id,
      action: "report.generate_draft",
      entityType: "report",
      entityId: report.id,
      metadata: { patientId, type },
    })

    revalidatePath("/dashboard/history")
    revalidatePath("/dashboard")
    return { success: true, redirect: "/dashboard/history" }
  } catch (error) {
    console.error("AI Error:", error)
    return { success: false, error: "Fallo la generacion del borrador." }
  }
}

export async function getReportById(reportId: string) {
  try {
    const user = await requireCurrentUser()
    if (!reportId) {
      return { success: false, error: "Informe no especificado." }
    }

    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        deletedAt: null,
        OR: [{ userId: user.id }, { userId: null }],
      },
      include: { patient: true },
    })

    if (!report) {
      return { success: false, error: "Informe no encontrado." }
    }

    return { success: true, report }
  } catch (error) {
    console.error("Error fetching report:", error)
    return { success: false, error: "No se pudo cargar el informe." }
  }
}
