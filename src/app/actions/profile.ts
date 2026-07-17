"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser, logAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function updateProfile(formData: FormData) {
  try {
    const user = await requireCurrentUser();

    const name = formData.get("name") as string;
    const dni = formData.get("dni") as string;
    const colegiado = formData.get("colegiado") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const bio = formData.get("bio") as string;
    const specialization = formData.get("specialization") as string;
    const avatarUrl = formData.get("avatarUrl") as string;
    const signatureDataUrl = formData.get("signatureDataUrl") as string;
    const stampDataUrl = formData.get("stampDataUrl") as string;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        dni,
        colegiado: colegiado || null,
        phone: phone || null,
        address: address || null,
        bio: bio || null,
        specialization: specialization || null,
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

export async function updatePlatformPreferences(input: {
  compactMode?: boolean;
  remindersEnabled?: boolean;
  exportJsonByDefault?: boolean;
  privacyMode?: boolean;
}) {
  try {
    const user = await requireCurrentUser();

    const data: Record<string, boolean> = {};
    if (typeof input.compactMode === "boolean") data.compactMode = input.compactMode;
    if (typeof input.remindersEnabled === "boolean") data.remindersEnabled = input.remindersEnabled;
    if (typeof input.exportJsonByDefault === "boolean") data.exportJsonByDefault = input.exportJsonByDefault;
    if (typeof input.privacyMode === "boolean") data.privacyMode = input.privacyMode;

    if (Object.keys(data).length === 0) {
      return { success: false, error: "Nada que actualizar." };
    }

    await prisma.user.update({
      where: { id: user.id },
      data,
    });

    await logAudit({
      userId: user.id,
      action: "profile.preferences_update",
      entityType: "user",
      entityId: user.id,
      metadata: data,
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "No se pudieron guardar las preferencias." };
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
        colegiado: user.colegiado || "",
        phone: user.phone || "",
        address: user.address || "",
        bio: user.bio || "",
        specialization: user.specialization || "",
        signatureDataUrl: user.signatureDataUrl || "",
        stampDataUrl: user.stampDataUrl || "",
      },
    };
  } catch (error) {
    console.error(error);
    return { success: false, profile: null };
  }
}
