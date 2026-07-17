import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

const JITSI_DOMAIN = process.env.NEXT_PUBLIC_JITSI_DOMAIN || "meet.jit.si";
const JITSI_APP_ID = process.env.JITSI_APP_ID || "";
const JITSI_APP_SECRET = process.env.JITSI_APP_SECRET || "";

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const appointmentId = String(body.appointmentId || "");

    let roomName = `Emotiva-${randomUUID().slice(0, 8)}`;
    let roomPassword = randomUUID().slice(0, 12);
    let patientId: string | null = null;

    if (appointmentId) {
      const appointment = await prisma.appointment.findFirst({
        where: {
          id: appointmentId,
          deletedAt: null,
          OR: [{ userId: user.id }, { userId: null }],
        },
        include: { patient: true },
      });

      if (!appointment) {
        return NextResponse.json({ error: "Cita no encontrada." }, { status: 404 });
      }

      patientId = appointment.patientId;

      roomName = appointment.roomName || `Emotiva-${appointment.id.slice(0, 8)}`;
      const existingPassword = (appointment as { roomPassword?: string | null }).roomPassword;
      roomPassword = existingPassword || randomUUID().slice(0, 12);

      await prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          userId: user.id,
          type: "Videoconsulta",
          provider: appointment.provider || "jitsi",
          roomName,
          roomPassword,
          meetingUrl: `https://${JITSI_DOMAIN}/${roomName}`,
        },
      });
    }

    const isSecure = Boolean(JITSI_APP_ID && JITSI_APP_SECRET);
    let jwtToken: string | null = null;

    if (isSecure) {
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        aud: JITSI_APP_ID,
        iss: JITSI_APP_ID,
        sub: JITSI_DOMAIN,
        room: roomName,
        iat: now,
        nbf: now - 5,
        exp: now + 60 * 60 * 3,
        context: {
          user: {
            name: user.name,
            email: user.email,
            id: user.id,
          },
          features: {
            recording: false,
            livestreaming: false,
            "outbound-call": false,
            transcription: false,
          },
        },
      };

      jwtToken = jwt.sign(payload, JITSI_APP_SECRET, { algorithm: "HS256" });
    }

    return NextResponse.json({
      domain: JITSI_DOMAIN,
      roomName,
      roomPassword,
      token: jwtToken,
      isSecure,
      patientId: patientId ?? null,
    });
  } catch (error) {
    console.error("Jitsi token error:", error);
    return NextResponse.json({ error: "No se pudo preparar la sala." }, { status: 500 });
  }
}
