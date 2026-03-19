import { randomUUID } from "crypto";
import type { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/auth";
import { isValidEmail, isValidSpanishDni, normalizeDni, normalizeEmail, validatePasswordStrength } from "@/lib/validators";

export const SESSION_COOKIE = "psyreport_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const SELF_REGISTRATION_ENABLED = process.env.ENABLE_SELF_REGISTRATION !== "false";

function shouldUseSecureCookies(request: NextRequest) {
  if (process.env.NODE_ENV !== "production") {
    return false;
  }

  const host = (request.headers.get("host") || "").toLowerCase();
  return !(host.includes("127.0.0.1") || host.includes("localhost"));
}

function getRequestIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;
}

function getRequestUserAgent(request: NextRequest) {
  return request.headers.get("user-agent") || null;
}

export async function createSessionForResponse(response: NextResponse, userId: string, request: NextRequest) {
  const sessionToken = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expiresAt,
      ip: getRequestIp(request),
      userAgent: getRequestUserAgent(request),
    },
  });

  response.cookies.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: shouldUseSecureCookies(request),
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function loginFromRequest(emailRaw: string, password: string) {
  const email = normalizeEmail(emailRaw);

  if (!email || !password) {
    return { success: false, error: "Faltan datos." };
  }

  if (!isValidEmail(email)) {
    return { success: false, error: "Introduce un email valido." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    await logAudit({ action: "login.failed", entityType: "user", metadata: { email, reason: "user_not_found" } });
    return { success: false, error: "Credenciales invalidas." };
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    await logAudit({
      userId: user.id,
      action: "login.failed",
      entityType: "user",
      entityId: user.id,
      metadata: { reason: "password_mismatch" },
    });
    return { success: false, error: "Credenciales invalidas." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  await logAudit({ userId: user.id, action: "login", entityType: "user", entityId: user.id });
  return { success: true, userId: user.id };
}

export async function registerFromRequest(input: {
  name: string;
  email: string;
  dni: string;
  password: string;
  invitationToken?: string;
}) {
  const invitationToken = (input.invitationToken || "").trim();

  if (!SELF_REGISTRATION_ENABLED && !invitationToken) {
    return {
      success: false,
      error: "El alta de nuevas cuentas esta desactivada. Contacta con la administracion del centro.",
    };
  }

  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const password = input.password;
  const dni = normalizeDni(input.dni);
  let invitationRole = "PSYCHOLOGIST";

  if (!name || !email || !password) {
    return { success: false, error: "Todos los campos obligatorios." };
  }

  if (!isValidEmail(email)) {
    return { success: false, error: "Introduce un email valido." };
  }

  if (!isValidSpanishDni(dni)) {
    return { success: false, error: "El DNI profesional no tiene un formato valido." };
  }

  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    return { success: false, error: passwordError };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    await logAudit({ action: "register.duplicate_email", entityType: "user", metadata: { email } });
    return { success: false, error: "Este email ya esta registrado." };
  }

  if (invitationToken) {
    const invitation = await prisma.invitation.findFirst({
      where: {
        token: invitationToken,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!invitation) {
      return { success: false, error: "La invitacion ya no es valida." };
    }

    if (normalizeEmail(invitation.email) !== email) {
      return { success: false, error: "El email no coincide con la invitacion recibida." };
    }

    invitationRole = invitation.role || "PSYCHOLOGIST";
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      dni: dni || null,
      role: invitationRole,
      password: hashedPassword,
    },
  });

  if (invitationToken) {
    await prisma.invitation.updateMany({
      where: { token: invitationToken, acceptedAt: null },
      data: { acceptedAt: new Date() },
    });
  }

  await logAudit({ userId: user.id, action: "register", entityType: "user", entityId: user.id });
  return { success: true, userId: user.id };
}
