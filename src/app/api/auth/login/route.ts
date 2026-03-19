import { NextRequest, NextResponse } from "next/server";
import { createSessionForResponse, loginFromRequest } from "@/lib/auth-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await loginFromRequest(String(body.email || ""), String(body.password || ""));

    if (!result.success || !result.userId) {
      return NextResponse.json({ success: false, error: result.error || "No se pudo iniciar sesion." }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });
    await createSessionForResponse(response, result.userId, request);
    return response;
  } catch (error) {
    console.error("API login err:", error);
    return NextResponse.json({ success: false, error: "Fallo en el servidor." }, { status: 500 });
  }
}
