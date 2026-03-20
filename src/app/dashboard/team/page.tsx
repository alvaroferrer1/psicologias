import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth";
import { getInvitations } from "@/app/actions/auth";
import { TeamInvitesClient } from "@/components/TeamInvitesClient";

export default async function TeamPage() {
  await requireAdminUser();
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
      createdAt: true,
      lockedUntil: true,
    },
  });

  const invitations = await getInvitations();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-secondary-text md:text-3xl">Equipo e invitaciones</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">Crea accesos por email con rol, revisa invitaciones y controla quien entra al sistema.</p>
      </div>

      {!emailConfigured && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          El envio real de correos aun no esta configurado en este entorno. Para invitaciones y recuperacion reales hacen falta
          <span className="mx-1 font-mono">RESEND_API_KEY</span>,
          <span className="mx-1 font-mono">RESEND_FROM_EMAIL</span> y
          <span className="mx-1 font-mono">NEXT_PUBLIC_APP_URL</span>.
        </div>
      )}

      <TeamInvitesClient
        users={users.map((user) => ({
          ...user,
          createdAt: user.createdAt.toISOString(),
        }))}
        invitations={invitations.map((invitation) => ({
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          token: invitation.token,
          createdAt: invitation.createdAt.toISOString(),
          expiresAt: invitation.expiresAt.toISOString(),
          acceptedAt: invitation.acceptedAt?.toISOString() || null,
          invitedBy: invitation.invitedByUser?.name || "Administrador",
        }))}
      />
    </div>
  );
}
