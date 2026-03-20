import { randomUUID } from "crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canEditRole, isAdminRole } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

const SESSION_COOKIE = "psyreport_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const SESSION_REFRESH_THRESHOLD = 60 * 60 * 24;

function shouldUseSecureCookies(hostHeader?: string | null) {
  if (process.env.NODE_ENV !== "production") {
    return false;
  }

  const host = (hostHeader || "").toLowerCase();
  return !(host.includes("127.0.0.1") || host.includes("localhost"));
}

export async function getCurrentSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value || null;
}

export async function createAppSession(userId: string) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const sessionToken = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);
  const secure = shouldUseSecureCookies(headerStore.get("host"));

  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expiresAt,
      ip: headerStore.get("x-forwarded-for") || headerStore.get("x-real-ip") || null,
      userAgent: headerStore.get("user-agent") || null,
    },
  });

  cookieStore.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  return sessionToken;
}

export async function revokeCurrentSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;

  if (sessionToken) {
    await prisma.session.updateMany({
      where: { sessionToken, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function revokeAllUserSessions(userId: string, exceptSessionToken?: string | null) {
  await prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null,
      ...(exceptSessionToken ? { sessionToken: { not: exceptSessionToken } } : {}),
    },
    data: { revokedAt: new Date() },
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionToken) {
    return null;
  }

  await prisma.session.updateMany({
    where: {
      expiresAt: { lte: new Date() },
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });

  const session = await prisma.session.findFirst({
    where: {
      sessionToken,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!session?.user) {
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  const now = Date.now();
  const nextExpiry = new Date(now + SESSION_MAX_AGE * 1000);
  const shouldRefresh = session.expiresAt.getTime() - now < SESSION_REFRESH_THRESHOLD * 1000;

  await prisma.session.update({
    where: { id: session.id },
    data: {
      lastSeenAt: new Date(),
      ...(shouldRefresh ? { expiresAt: nextExpiry } : {}),
    },
  });

  if (shouldRefresh) {
    cookieStore.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: shouldUseSecureCookies(headerStore.get("host")),
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
  }

  return session.user;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  return user;
}

export async function requireEditableUser() {
  const user = await requireCurrentUser();
  if (!canEditRole(user.role)) {
    redirect("/dashboard");
  }
  return user;
}

export async function requireAdminUser() {
  const user = await requireCurrentUser();
  if (!isAdminRole(user.role)) {
    redirect("/dashboard");
  }
  return user;
}

export { logAudit };
