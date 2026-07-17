"use server";

import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth";
import { isValidEmail, isValidSpanishDni, normalizeDni, normalizeEmail, validatePasswordStrength } from "@/lib/validators";
import {
  createAppSession,
  getCurrentSessionToken,
  getCurrentUser,
  logAudit,
  revokeAllUserSessions,
  revokeCurrentSession,
} from "@/lib/auth";
import { clearFailedLogins, getLoginBlockStatus, registerFailedLogin } from "@/lib/login-block";

const SELF_REGISTRATION_ENABLED = process.env.ENABLE_SELF_REGISTRATION !== "false";

function buildEmailShell(input: { title: string; intro: string; actionUrl: string; actionLabel: string; footer?: string }) {
  return `
    <div style="margin:0;padding:24px;background:#f4f7fb;font-family:Arial,sans-serif;color:#0f172a;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5edf7;border-radius:20px;overflow:hidden;">
        <div style="height:14px;background:linear-gradient(90deg,#a7d3f5 0%,#d8d2ff 55%,#ffffff 100%);"></div>
        <div style="padding:32px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="font-size:13px;letter-spacing:2px;font-weight:700;color:#1e3a8a;text-transform:uppercase;">Centro Psicologico Emotiva</div>
            <h1 style="margin:12px 0 0;font-size:28px;line-height:1.15;">${input.title}</h1>
          </div>
          <p style="font-size:15px;line-height:1.7;margin:0 0 18px;">${input.intro}</p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${input.actionUrl}" style="display:inline-block;background:#1967d2;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:12px;font-weight:700;">
              ${input.actionLabel}
            </a>
          </div>
          <p style="font-size:12px;line-height:1.7;color:#475569;margin:0 0 8px;">
            Este documento carece de valor medico-legal y es para uso exclusivamente profesional.
          </p>
          <p style="font-size:12px;line-height:1.7;color:#64748b;margin:0;">
            ${input.footer || "Si no has solicitado esta accion, puedes ignorar este correo."}
          </p>
        </div>
      </div>
    </div>
  `;
}

async function sendEmailIfConfigured(input: { to: string; subject: string; html: string }) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return { sent: false, reason: "missing_config" as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: input.to,
      subject: input.subject,
      html: input.html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { sent: false, reason: "provider_error" as const, errorText };
  }

  return { sent: true };
}

export async function registerUser(formData: FormData) {
  try {
    const invitationToken = String(formData.get("invitationToken") || "").trim();

    if (!SELF_REGISTRATION_ENABLED && !invitationToken) {
      return {
        success: false,
        error: "El alta de nuevas cuentas esta desactivada. Contacta con la administracion del centro.",
      };
    }

    const name = String(formData.get("name") || "").trim();
    const email = normalizeEmail(String(formData.get("email") || ""));
    const password = String(formData.get("password") || "");
    const dni = normalizeDni(String(formData.get("dni") || ""));
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
    const email = normalizeEmail(String(formData.get("email") || ""));
    const password = String(formData.get("password") || "");

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
          error: "Demasiados intentos fallidos. Cuenta bloqueada 15 minutos por seguridad.",
        };
      }
      return { success: false, error: "Credenciales invalidas." };
    }

    await clearFailedLogins(user.id);

    await createAppSession(user.id);
    await logAudit({ userId: user.id, action: "login", entityType: "user", entityId: user.id });

    return { success: true };
  } catch (error) {
    console.error("Login err:", error);
    return { success: false, error: "Fallo en el servidor." };
  }
}

export async function createInvitation(input: { email: string; role: string }) {
  try {
    const admin = await requireAdminUser();
    const email = normalizeEmail(input.email);
    const role = ["ADMIN", "PSYCHOLOGIST", "READONLY"].includes(input.role) ? input.role : "PSYCHOLOGIST";

    if (!isValidEmail(email)) {
      return { success: false, error: "Introduce un email valido." };
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
    const invitation = await prisma.invitation.create({
      data: {
        email,
        role,
        token,
        invitedByUserId: admin.id,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const invitationUrl = `${baseUrl}/?mode=register&invite=${token}&email=${encodeURIComponent(email)}`;

    const delivery = await sendEmailIfConfigured({
      to: email,
      subject: "Invitacion a Emotiva PsyReport",
      html: buildEmailShell({
        title: "Invitacion al equipo",
        intro: `Has sido invitada a Emotiva PsyReport con el rol <strong>${role}</strong>. Pulsa el boton para completar tu registro y acceder al sistema.`,
        actionUrl: invitationUrl,
        actionLabel: "Completar registro",
      }),
    });

    await logAudit({
      userId: admin.id,
      action: "invitation.create",
      entityType: "invitation",
      entityId: invitation.id,
      metadata: { email, role },
    });

    revalidatePath("/dashboard/team");
    return { success: true, invitationUrl, emailSent: delivery.sent, emailReason: delivery.sent ? null : delivery.reason };
  } catch (error) {
    console.error("Invitation error:", error);
    return { success: false, error: "No se pudo crear la invitacion." };
  }
}

export async function getInvitations() {
  try {
    await requireAdminUser();
    return await prisma.invitation.findMany({
      orderBy: { createdAt: "desc" },
      include: { invitedByUser: true },
    });
  } catch (error) {
    console.error("Get invitations error:", error);
    return [];
  }
}

export async function getInvitationByToken(token: string) {
  try {
    if (!token) return { success: false, invitation: null };
    const invitation = await prisma.invitation.findFirst({
      where: {
        token,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    return { success: Boolean(invitation), invitation };
  } catch (error) {
    console.error("Get invitation token error:", error);
    return { success: false, invitation: null };
  }
}

export async function forgotPassword(email: string) {
  try {
    const safeEmail = normalizeEmail(email);
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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(safeEmail)}`;
    const delivery = await sendEmailIfConfigured({
      to: safeEmail,
      subject: "Recuperacion de acceso a Emotiva PsyReport",
      html: buildEmailShell({
        title: "Recuperacion de contrasena",
        intro: "Hemos recibido una solicitud para restablecer tu contrasena. Pulsa el boton para crear una nueva contrasena y recuperar el acceso.",
        actionUrl: resetUrl,
        actionLabel: "Restablecer contrasena",
      }),
    });

    if (delivery.sent) {
      return {
        success: true,
        message: "Si el correo existe, se le enviara un email de recuperacion.",
      };
    }

    if (process.env.NODE_ENV !== "production") {
      return {
        success: true,
        message: "Solicitud registrada. Usa el enlace local de recuperacion para establecer una nueva contrasena.",
        devLink: `/reset-password?token=${token}&email=${safeEmail}`,
      };
    }

    return {
      success: false,
      error: "El sistema de correo no esta configurado todavia. Falta conectar un proveedor real para enviar emails.",
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
