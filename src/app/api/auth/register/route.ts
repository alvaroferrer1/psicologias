import { NextRequest, NextResponse } from "next/server";
import { createSessionForResponse, registerFromRequest } from "@/lib/auth-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await registerFromRequest({
      name: String(body.name || ""),
      email: String(body.email || ""),
      dni: String(body.dni || ""),
      password: String(body.password || ""),
      invitationToken: String(body.invitationToken || ""),
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
