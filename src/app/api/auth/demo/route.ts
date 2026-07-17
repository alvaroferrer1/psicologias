import { NextRequest, NextResponse } from "next/server";
import { createSessionForResponse, ensureDemoUser, loginFromRequest } from "@/lib/auth-api";
import { applyAuthRateLimit } from "@/lib/auth-middleware";

export async function POST(request: NextRequest) {
  const rateLimited = await applyAuthRateLimit(request);
  if (rateLimited) return rateLimited;

  try {
    const demo = await ensureDemoUser();
    if (!demo.success) {
      return NextResponse.json({ success: false, error: demo.error }, { status: 400 });
    }

    const result = await loginFromRequest(demo.email, demo.password, true);

    if (!result.success || !result.userId) {
      return NextResponse.json({ success: false, error: result.error || "No se pudo acceder con la demo." }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });
    await createSessionForResponse(response, result.userId, request);
    return response;
  } catch (error) {
    console.error("API demo login err:", error);
    return NextResponse.json({ success: false, error: "Fallo en el servidor." }, { status: 500 });
  }
}
