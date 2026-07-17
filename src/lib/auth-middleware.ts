import { NextResponse } from "next/server";
import { createRateLimiter, getClientIdentifier } from "@/lib/rate-limit";

const authRateLimiter = createRateLimiter({
  prefix: "auth",
  limit: 10,
  windowSec: 60,
});

const MAX_BODY_SIZE = 1024 * 50;

export async function applyAuthRateLimit(request: Request) {
  const ip = getClientIdentifier(request, "anonymous");
  const result = await authRateLimiter(ip);
  if (!result.success) {
    const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
    return NextResponse.json(
      { success: false, error: "Demasiados intentos. Espera un momento e intenta de nuevo." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }
  return null;
}

export async function safeParseJson(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return { ok: false as const, error: "Content-Type no valido." };
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY_SIZE) {
    return { ok: false as const, error: "Cuerpo demasiado grande." };
  }
  try {
    return { ok: true as const, data: JSON.parse(raw) };
  } catch {
    return { ok: false as const, error: "JSON invalido." };
  }
}
