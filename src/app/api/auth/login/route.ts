import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSessionForResponse, loginFromRequest } from "@/lib/auth-api";
import { applyAuthRateLimit, safeParseJson } from "@/lib/auth-middleware";

const loginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
  remember: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const rateLimited = await applyAuthRateLimit(request);
  if (rateLimited) return rateLimited;

  const parsed = await safeParseJson(request);
  if (!parsed.ok) {
    return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
  }

  const validation = loginSchema.safeParse(parsed.data);
  if (!validation.success) {
    return NextResponse.json({ success: false, error: "Datos invalidos." }, { status: 400 });
  }

  try {
    const result = await loginFromRequest(
      validation.data.email,
      validation.data.password,
      validation.data.remember
    );

    if (!result.success || !result.userId) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "No se pudo iniciar sesion.",
          blocked: "blocked" in result ? result.blocked : false,
          retryAfterMinutes: "retryAfterMinutes" in result ? result.retryAfterMinutes : undefined,
          attemptsLeft: "attemptsLeft" in result ? result.attemptsLeft : undefined,
        },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ success: true });
    await createSessionForResponse(response, result.userId, request, { remember: validation.data.remember });
    return response;
  } catch (error) {
    console.error("API login err:", error);
    return NextResponse.json({ success: false, error: "Fallo en el servidor." }, { status: 500 });
  }
}
