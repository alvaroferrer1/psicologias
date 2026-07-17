import { NextRequest, NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "psyreport_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const SESSION_REFRESH_THRESHOLD = 60 * 60 * 24;

function shouldUseSecureCookies(hostHeader?: string | null) {
  if (process.env.NODE_ENV !== "production") return false;
  const host = (hostHeader || "").toLowerCase();
  return !(host.includes("127.0.0.1") || host.includes("localhost"));
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const headerStore = await headers();
    const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionToken) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const now = Date.now();
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
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const shouldRefresh = session.expiresAt.getTime() - now < SESSION_REFRESH_THRESHOLD * 1000;
    if (shouldRefresh) {
      const nextExpiry = new Date(now + SESSION_MAX_AGE * 1000);
      await prisma.session.update({
        where: { id: session.id },
        data: { expiresAt: nextExpiry, lastSeenAt: new Date() },
      });
      cookieStore.set(SESSION_COOKIE, sessionToken, {
        httpOnly: true,
        secure: shouldUseSecureCookies(headerStore.get("host")),
        sameSite: "lax",
        maxAge: SESSION_MAX_AGE,
        path: "/",
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
