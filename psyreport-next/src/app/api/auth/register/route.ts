import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSessionForResponse, registerFromRequest } from "@/lib/auth-api";
import { applyAuthRateLimit, safeParseJson } from "@/lib/auth-middleware";

const registerSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  dni: z.string().min(0).max(20),
  password: z.string().min(8).max(200),
  phone: z.string().max(30).optional(),
  colegiado: z.string().max(60).optional(),
  invitationToken: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  const rateLimited = await applyAuthRateLimit(request);
  if (rateLimited) return rateLimited;

  const parsed = await safeParseJson(request);
  if (!parsed.ok) {
    return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
  }

  const validation = registerSchema.safeParse(parsed.data);
  if (!validation.success) {
    return NextResponse.json({ success: false, error: "Datos invalidos." }, { status: 400 });
  }

  try {
    const result = await registerFromRequest({
      name: validation.data.name,
      email: validation.data.email,
      dni: validation.data.dni,
      password: validation.data.password,
      phone: validation.data.phone,
      colegiado: validation.data.colegiado,
      invitationToken: validation.data.invitationToken || "",
    });

    if (!result.success || !result.userId) {
      return NextResponse.json({ success: false, error: result.error || "No se pudo crear la cuenta." }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });
    await createSessionForResponse(response, result.userId, request);
    return response;
  } catch (error) {
    console.error("API register err:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor." }, { status: 500 });
  }
}
