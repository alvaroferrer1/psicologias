import { randomUUID } from "crypto";
import type { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { isValidEmail, isValidSpanishDni, isValidSpanishPhone, normalizeDni, normalizeEmail, validatePasswordStrength } from "@/lib/validators";
import { clearFailedLogins, getLoginBlockStatus, registerFailedLogin, LOCK_DURATION_MS, MAX_FAILED_ATTEMPTS } from "@/lib/login-block";

export const SESSION_COOKIE = "psyreport_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
export const SESSION_REMEMBER_MAX_AGE = 60 * 60 * 24 * 30;
const DEFAULT_DEMO_EMAIL = "demo@psyreport.es";
const DEFAULT_DEMO_PASSWORD = "Demo1234";

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

export async function createSessionForResponse(
  response: NextResponse,
  userId: string,
  request: NextRequest,
  options?: { remember?: boolean }
) {
  const remember = Boolean(options?.remember);
  const maxAge = remember ? SESSION_REMEMBER_MAX_AGE : SESSION_MAX_AGE;
  const sessionToken = randomUUID();
  const expiresAt = new Date(Date.now() + maxAge * 1000);

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
    maxAge,
    path: "/",
  });
}

export async function loginFromRequest(emailRaw: string, password: string, remember?: boolean) {
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

  const block = await getLoginBlockStatus(user.id);
  if (block.blocked) {
    await logAudit({
      userId: user.id,
      action: "login.blocked",
      entityType: "user",
      entityId: user.id,
      metadata: { retryAfterSeconds: block.retryAfterSeconds },
    });
    return {
      success: false,
      blocked: true,
      retryAfterMinutes: Math.ceil(block.retryAfterSeconds / 60),
      error: `Cuenta temporalmente bloqueada. Intenta de nuevo en ${Math.ceil(block.retryAfterSeconds / 60)} minuto(s).`,
    };
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const result = await registerFailedLogin(user.id);
    await logAudit({
      userId: user.id,
      action: "login.failed",
      entityType: "user",
      entityId: user.id,
      metadata: { reason: "password_mismatch", attempts: result.blocked ? "locked" : "increment" },
    });
    if (result.blocked) {
      return {
        success: false,
        blocked: true,
        retryAfterMinutes: Math.ceil((LOCK_DURATION_MS ?? 15 * 60 * 1000) / 60000),
        error: "Demasiados intentos fallidos. Cuenta bloqueada 15 minutos por seguridad.",
      };
    }
    const attemptsLeft = Math.max(0, MAX_FAILED_ATTEMPTS - result.attempts);
    return {
      success: false,
      attemptsLeft,
      error: "Credenciales invalidas.",
    };
  }

  await clearFailedLogins(user.id);

  await logAudit({ userId: user.id, action: "login", entityType: "user", entityId: user.id });
  return { success: true, userId: user.id, remember };
}

export async function ensureDemoUser() {
  const email = normalizeEmail(process.env.NEXT_PUBLIC_DEMO_EMAIL || DEFAULT_DEMO_EMAIL);
  const password = process.env.NEXT_PUBLIC_DEMO_PASSWORD || DEFAULT_DEMO_PASSWORD;

  if (!email || !password) {
    return { success: false as const, error: "La demo no esta configurada." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      name: "Cuenta Demo",
      role: "ADMIN",
    },
    create: {
      email,
      password: hashedPassword,
      name: "Cuenta Demo",
      role: "ADMIN",
      dni: null,
    },
  });

  return { success: true as const, email, password, userId: user.id };
}

export async function registerFromRequest(input: {
  name: string;
  email: string;
  dni: string;
  password: string;
  phone?: string;
  colegiado?: string;
  invitationToken?: string;
}) {
  const invitationToken = (input.invitationToken || "").trim();

  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const password = input.password;
  const dni = normalizeDni(input.dni);
  const phone = input.phone ? input.phone.trim() : "";
  const colegiado = input.colegiado ? input.colegiado.trim() : "";
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

  if (phone && !isValidSpanishPhone(phone)) {
    return { success: false, error: "El telefono no tiene un formato valido." };
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

  if (dni) {
    const existingDniUser = await prisma.user.findFirst({ where: { dni } });
    if (existingDniUser) {
      await logAudit({ action: "register.duplicate_dni", entityType: "user", metadata: { dni } });
      return { success: false, error: "Este DNI profesional ya esta registrado." };
    }
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
      phone: phone || null,
      colegiado: colegiado || null,
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
