import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth";
import { getInvitations } from "@/app/actions/auth";
import { TeamInvitesClient } from "@/components/TeamInvitesClient";
import { getServerT } from "@/lib/i18n-server";

export default async function TeamPage() {
  const user = await requireAdminUser();
  const { t, lang } = await getServerT();
  const emailConfigured = Boolean(
    process.env.RESEND_API_KEY &&
    process.env.RESEND_FROM_EMAIL &&
    process.env.NEXT_PUBLIC_APP_URL
  );

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      dni: true,
      role: true,
      colegiado: true,
      specialization: true,
      createdAt: true,
      lockedUntil: true,
      _count: {
        select: { patients: true, appointments: true, reports: true },
      },
    },
  });

  const invitations = await getInvitations();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-secondary-text md:text-3xl">{t("Equipo")}</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">{t("Invita y gestiona los profesionales de tu clínica.")}</p>
      </div>

      {!emailConfigured && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          {t("Invitar miembro")}
          <span className="mx-1 font-mono">RESEND_API_KEY</span>,
          <span className="mx-1 font-mono">RESEND_FROM_EMAIL</span> y
          <span className="mx-1 font-mono">NEXT_PUBLIC_APP_URL</span>.
        </div>
      )}

      <TeamInvitesClient
        currentUserId={user.id}
        users={users.map((u) => ({
          ...u,
          colegiado: u.colegiado || "",
          specialization: u.specialization || "",
          createdAt: u.createdAt.toISOString(),
          lockedUntil: u.lockedUntil ? u.lockedUntil.toISOString() : null,
          counts: {
            patients: u._count.patients,
            appointments: u._count.appointments,
            reports: u._count.reports,
          },
        }))}
        invitations={invitations.map((invitation) => ({
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          token: invitation.token,
          createdAt: invitation.createdAt.toISOString(),
          expiresAt: invitation.expiresAt.toISOString(),
          acceptedAt: invitation.acceptedAt?.toISOString() || null,
          invitedBy: invitation.invitedByUser?.name || t("Por invitación"),
        }))}
      />
    </div>
  );
}
