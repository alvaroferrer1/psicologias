import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, logAudit } from "@/lib/auth";
import { canEditRole } from "@/lib/permissions";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (!canEditRole(user.role)) {
      return NextResponse.json({ error: "Tu rol es de solo lectura." }, { status: 403 });
    }

    const { reportId, patientId, title, body, type, status, reportKind, patientCategory } = await req.json();

    if (!patientId || !title) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        deletedAt: null,
        OR: [{ userId: user.id }, { userId: null }],
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "No tienes acceso a ese paciente" }, { status: 403 });
    }

    if (reportId) {
      const existingReport = await prisma.report.findFirst({
        where: {
          id: reportId,
          deletedAt: null,
          OR: [{ userId: user.id }, { userId: null }],
        },
      });

      if (!existingReport) {
        return NextResponse.json({ error: "No tienes acceso a ese informe" }, { status: 403 });
      }
    }

    const report = reportId
      ? await prisma.report.update({
          where: { id: reportId },
          data: {
            userId: user.id,
            title,
            content: body || null,
            type: type || "adulto",
            reportKind: reportKind || "informe",
            patientCategory: patientCategory || "adulto",
            patientId,
            status: status || "Borrador",
          },
        })
      : await prisma.report.create({
          data: {
            userId: user.id,
            title,
            content: body || null,
            type: type || "adulto",
            reportKind: reportKind || "informe",
            patientCategory: patientCategory || "adulto",
            patientId,
            status: status || "Borrador",
          },
        });

    const latestVersion = await prisma.reportVersion.findFirst({
      where: { reportId: report.id },
      orderBy: { version: "desc" },
      select: { version: true },
    });

    await prisma.reportVersion.create({
      data: {
        reportId: report.id,
        version: (latestVersion?.version || 0) + 1,
        title: report.title,
        type: report.type,
        status: report.status,
        content: report.content,
        createdByUserId: user.id,
      },
    });

    await logAudit({
      userId: user.id,
      action: reportId ? "report.update" : "report.create",
      entityType: "report",
      entityId: report.id,
      metadata: { patientId, status: report.status, type: report.type, reportKind: report.reportKind, patientCategory: report.patientCategory },
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("Error saving report:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
