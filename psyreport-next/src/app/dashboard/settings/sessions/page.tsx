import { requireCurrentUser, getCurrentSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionManager } from "@/components/SessionManager";
import { SettingsShell } from "@/components/SettingsShell";
import { KeyRound } from "lucide-react";
import { getServerT } from "@/lib/i18n-server";

export default async function SessionsPage() {
  const user = await requireCurrentUser();
  const { t, lang } = await getServerT();
  const locale = lang === "en" ? "en-US" : "es-ES";
  const currentSessionToken = await getCurrentSessionToken();
  const sessions = await prisma.session.findMany({
    where: { userId: user.id, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastSeenAt: "desc" },
  });

  return (
    <SettingsShell title={t("Sesiones")} description={t("Dispositivos y accesos activos.")} icon={<KeyRound className="h-7 w-7" />}>
      <SessionManager
        sessions={sessions.map((session) => ({
          id: session.id,
          userAgent: session.userAgent,
          ip: session.ip,
          lastSeenAt: session.lastSeenAt.toLocaleString(locale),
          expiresAt: session.expiresAt.toLocaleString(locale),
          isCurrent: session.sessionToken === currentSessionToken,
        }))}
      />
    </SettingsShell>
  );
}
