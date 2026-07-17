import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { forgotPassword } from "@/app/actions/auth";
import { applyAuthRateLimit, safeParseJson } from "@/lib/auth-middleware";

const forgotSchema = z.object({
  email: z.string().email().max(200),
});

export async function POST(request: NextRequest) {
  const rateLimited = await applyAuthRateLimit(request);
  if (rateLimited) return rateLimited;

  const parsed = await safeParseJson(request);
  if (!parsed.ok) {
    return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
  }

  const validation = forgotSchema.safeParse(parsed.data);
  if (!validation.success) {
    return NextResponse.json({ success: false, error: "Introduce un email valido." }, { status: 400 });
  }

  try {
    const result = await forgotPassword(validation.data.email);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error("API forgot err:", error);
    return NextResponse.json({ success: false, error: "Error al gestionar el reseteo." }, { status: 500 });
  }
}
