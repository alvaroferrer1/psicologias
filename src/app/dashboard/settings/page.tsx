import SettingsForm from "@/components/SettingsForm";
import { CookiePreferences } from "@/components/CookiePreferences";
import { PlatformPreferences } from "@/components/PlatformPreferences";
import { SessionManager } from "@/components/SessionManager";
import { SettingsInfoCards } from "@/components/SettingsInfoCards";
import { getCurrentSessionToken, requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const user = await requireCurrentUser();
  const currentSessionToken = await getCurrentSessionToken();
  const sessions = await prisma.session.findMany({
    where: {
      userId: user.id,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastSeenAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-secondary-text md:text-3xl">Configuración</h1>
          <p className="mt-1 font-medium text-slate-500">Administra preferencias de plataforma, tu cuenta y normativas legales.</p>
        </div>
      </div>

      <div className="flex flex-col space-y-6">
        <div className="w-full space-y-6">
          <SettingsForm user={user} />
          <SettingsInfoCards />
          <PlatformPreferences />
          <SessionManager
            sessions={sessions.map((session) => ({
              id: session.id,
              userAgent: session.userAgent,
              ip: session.ip,
              lastSeenAt: session.lastSeenAt.toLocaleString("es-ES"),
              expiresAt: session.expiresAt.toLocaleString("es-ES"),
              isCurrent: session.sessionToken === currentSessionToken,
            }))}
          />
          <CookiePreferences />
        </div>
      </div>
    </div>
  );
}
