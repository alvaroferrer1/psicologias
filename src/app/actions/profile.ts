"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireCurrentUser, logAudit } from "@/lib/auth";

export async function updateProfile(formData: FormData) {
  try {
    const user = await requireCurrentUser();

    const name = formData.get("name") as string;
    const colegiado = formData.get("colegiado") as string;
    const avatarUrl = formData.get("avatarUrl") as string;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        colegiado,
        avatarUrl
      }
    });

    await logAudit({
      userId: user.id,
      action: "profile.update",
      entityType: "user",
      entityId: user.id,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");

    return { success: true, message: "Perfil guardado con éxito." };
  } catch (error) {
    console.error(error);
    return { success: false, error: "No se pudo actualizar el perfil." };
  }
}
