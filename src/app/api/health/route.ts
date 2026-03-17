import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [users, patients, reports, appointments, sessions] = await Promise.all([
      prisma.user.count(),
      prisma.patient.count({ where: { deletedAt: null } }),
      prisma.report.count({ where: { deletedAt: null } }),
      prisma.appointment.count({ where: { deletedAt: null } }),
      prisma.session.count({
        where: {
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      checkedAt: new Date().toISOString(),
      database: "up",
      counts: {
        users,
        patients,
        reports,
        appointments,
        sessions,
      },
    });
  } catch (error) {
    console.error("Health route error:", error);
    return NextResponse.json(
      {
        ok: false,
        checkedAt: new Date().toISOString(),
        database: "down",
      },
      { status: 500 }
    );
  }
}
