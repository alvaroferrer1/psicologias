"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser, logAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function updateProfile(formData: FormData) {
  try {
    const user = await requireCurrentUser();

    const name = formData.get("name") as string;
    const dni = formData.get("dni") as string;
    const avatarUrl = formData.get("avatarUrl") as string;
    const signatureDataUrl = formData.get("signatureDataUrl") as string;
    const stampDataUrl = formData.get("stampDataUrl") as string;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        dni,
        avatarUrl,
        signatureDataUrl: signatureDataUrl || null,
        stampDataUrl: stampDataUrl || null,
      },
    });

    await logAudit({
      userId: user.id,
      action: "profile.update",
      entityType: "user",
      entityId: user.id,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");

    return { success: true, message: "Perfil guardado con exito." };
  } catch (error) {
    console.error(error);
    return { success: false, error: "No se pudo actualizar el perfil." };
  }
}

export async function getProfileDefaults() {
  try {
    const user = await requireCurrentUser();
    return {
      success: true,
      profile: {
        name: user.name || "",
        dni: user.dni || "",
        signatureDataUrl: user.signatureDataUrl || "",
        stampDataUrl: user.stampDataUrl || "",
      },
    };
  } catch (error) {
    console.error(error);
    return { success: false, profile: null };
  }
}
