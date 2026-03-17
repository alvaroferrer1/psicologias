"use server";

import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  createAppSession,
  getCurrentSessionToken,
  getCurrentUser,
  logAudit,
  revokeAllUserSessions,
  revokeCurrentSession,
} from "@/lib/auth";

const SELF_REGISTRATION_ENABLED = process.env.ENABLE_SELF_REGISTRATION === "true";

export async function registerUser(formData: FormData) {
  try {
    if (!SELF_REGISTRATION_ENABLED) {
      return {
        success: false,
        error: "El alta de nuevas cuentas esta desactivada. Contacta con la administracion del centro.",
      };
    }

    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");

    if (!name || !email || !password) {
      return { success: false, error: "Todos los campos obligatorios." };
    }

    if (password.length < 8) {
      return { success: false, error: "La contrasena debe tener al menos 8 caracteres." };
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, error: "Este email ya esta registrado." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    await createAppSession(user.id);
    await logAudit({ userId: user.id, action: "register", entityType: "user", entityId: user.id });

    return { success: true };
  } catch (error) {
    console.error("Register err:", error);
    return { success: false, error: "Error interno del servidor." };
  }
}

export async function loginUser(formData: FormData) {
  try {
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");

    if (!email || !password) {
      return { success: false, error: "Faltan datos." };
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { success: false, error: "Credenciales invalidas." };
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return { success: false, error: "Credenciales invalidas." };
    }

    await createAppSession(user.id);
    await logAudit({ userId: user.id, action: "login", entityType: "user", entityId: user.id });

    return { success: true };
  } catch (error) {
    console.error("Login err:", error);
    return { success: false, error: "Fallo en el servidor." };
  }
}

export async function forgotPassword(email: string) {
  try {
    const safeEmail = email.trim().toLowerCase();
    if (!safeEmail) {
      return { success: false, error: "Introduce un email valido." };
    }

    const user = await prisma.user.findUnique({ where: { email: safeEmail } });
    if (!user) {
      return { success: true, message: "Si el correo existe, recibiras instrucciones." };
    }

    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    await logAudit({
      userId: user.id,
      action: "password_reset.request",
      entityType: "user",
      entityId: user.id,
      metadata: { email: safeEmail },
    });

    if (process.env.NODE_ENV !== "production") {
      return {
        success: true,
        message: "Solicitud registrada. Usa el enlace local de recuperacion para establecer una nueva contrasena.",
        devLink: `/reset-password?token=${token}&email=${safeEmail}`,
      };
    }

    return {
      success: true,
      message: "Solicitud registrada. Contacta con la administracion para completar la recuperacion segura de la cuenta.",
    };
  } catch (error) {
    console.error("Forgot password err:", error);
    return { success: false, error: "Error al gestionar el reseteo." };
  }
}

export async function resetPassword(formData: FormData) {
  try {
    const token = String(formData.get("token") || "").trim();
    const password = String(formData.get("password") || "");

    if (!token || password.length < 8) {
      return { success: false, error: "La nueva contrasena debe tener al menos 8 caracteres." };
    }

    const resetRecord = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!resetRecord?.user) {
      return { success: false, error: "El enlace de recuperacion ya no es valido." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.user.id },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    await revokeAllUserSessions(resetRecord.user.id);
    await createAppSession(resetRecord.user.id);

    await logAudit({
      userId: resetRecord.user.id,
      action: "password_reset.complete",
      entityType: "user",
      entityId: resetRecord.user.id,
    });

    return { success: true };
  } catch (error) {
    console.error("Reset password err:", error);
    return { success: false, error: "No se pudo actualizar la contrasena." };
  }
}

export async function logoutUser() {
  const user = await getCurrentUser();
  await revokeCurrentSession();
  if (user?.id) {
    await logAudit({ userId: user.id, action: "logout", entityType: "user", entityId: user.id });
  }
  revalidatePath("/");
  return { success: true };
}

export async function revokeOtherSessions() {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "No autorizado." };
  }

  const currentSessionToken = await getCurrentSessionToken();
  await revokeAllUserSessions(user.id, currentSessionToken);
  await logAudit({ userId: user.id, action: "session.revoke_others", entityType: "session" });
  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function revokeSessionById(sessionId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "No autorizado." };
  }

  const currentSessionToken = await getCurrentSessionToken();
  const currentSession = currentSessionToken
    ? await prisma.session.findUnique({ where: { sessionToken: currentSessionToken } })
    : null;

  const session = await prisma.session.findFirst({
    where: {
      id: sessionId,
      userId: user.id,
      revokedAt: null,
    },
  });

  if (!session) {
    return { success: false, error: "Sesion no encontrada." };
  }

  if (currentSession?.id === session.id) {
    await revokeCurrentSession();
  } else {
    await prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
  }

  await logAudit({
    userId: user.id,
    action: "session.revoke",
    entityType: "session",
    entityId: session.id,
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}
