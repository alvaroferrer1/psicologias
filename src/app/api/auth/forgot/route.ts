import { NextRequest, NextResponse } from "next/server";
import { forgotPassword } from "@/app/actions/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await forgotPassword(String(body.email || ""));
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error("API forgot err:", error);
    return NextResponse.json({ success: false, error: "Error al gestionar el reseteo." }, { status: 500 });
  }
}
