import { NextRequest, NextResponse } from "next/server";
import { createSessionForResponse, loginFromRequest } from "@/lib/auth-api";

export async function POST(request: NextRequest) {
  try {
    const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL || "";
    const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD || "";

    if (!demoEmail || !demoPassword) {
      return NextResponse.json({ success: false, error: "La demo no esta configurada." }, { status: 400 });
    }

    const result = await loginFromRequest(demoEmail, demoPassword);

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
