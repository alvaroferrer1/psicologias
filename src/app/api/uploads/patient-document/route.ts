import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

const BUCKET = process.env.SUPABASE_DOCUMENTS_BUCKET || "patient-documents";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({
        error: "Falta configurar Supabase Storage. Necesitas NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.",
      }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const patientId = String(formData.get("patientId") || "");

    if (!(file instanceof File) || !patientId) {
      return NextResponse.json({ error: "Faltan archivo o paciente." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const fileBuffer = Buffer.from(bytes);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${user.id}/${patientId}/${Date.now()}_${safeName}`;

    const { error } = await supabaseAdmin.storage.from(BUCKET).upload(storagePath, fileBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

    if (error) {
      return NextResponse.json({ error: `No se pudo subir el archivo: ${error.message}` }, { status: 500 });
    }

    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(storagePath);

    return NextResponse.json({
      success: true,
      url: data.publicUrl,
      storagePath,
      fileName: file.name,
      mimeType: file.type || null,
      sizeBytes: file.size,
    });
  } catch (error) {
    console.error("Upload patient document error:", error);
    return NextResponse.json({ error: "Error interno al subir el archivo." }, { status: 500 });
  }
}
