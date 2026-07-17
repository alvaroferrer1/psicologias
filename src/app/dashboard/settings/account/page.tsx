import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountForm } from "@/components/AccountForm";

export default async function AccountPage() {
  const user = await requireCurrentUser();

  const [patients, reports, appointments] = await Promise.all([
    prisma.patient.count({ where: { userId: user.id, deletedAt: null } }),
    prisma.report.count({ where: { userId: user.id, deletedAt: null } }),
    prisma.appointment.count({ where: { userId: user.id } }),
  ]);

  return (
    <AccountForm
      user={{
        name: user.name || "",
        dni: user.dni || "",
        colegiado: user.colegiado || "",
        phone: user.phone || "",
        address: user.address || "",
        bio: user.bio || "",
        specialization: user.specialization || "",
        email: user.email || "",
        role: user.role || "USER",
        avatarUrl: user.avatarUrl || "",
        signatureDataUrl: user.signatureDataUrl || "",
        stampDataUrl: user.stampDataUrl || "",
        createdAt: user.createdAt,
        lockedUntil: user.lockedUntil,
      }}
      stats={{ patients, reports, appointments }}
    />
  );
}
