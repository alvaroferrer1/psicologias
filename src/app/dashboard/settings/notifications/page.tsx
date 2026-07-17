import { requireCurrentUser } from "@/lib/auth";
import { NotificationSettings } from "@/components/NotificationSettings";
import { SettingsShell } from "@/components/SettingsShell";
import { Bell } from "lucide-react";
import { getServerT } from "@/lib/i18n-server";

export default async function NotificationsPage() {
  const user = await requireCurrentUser();
  const { t } = await getServerT();

  return (
    <SettingsShell title={t("Notificaciones")} description={t("Configura avisos y recordatorios.")} icon={<Bell className="h-7 w-7" />}>
      <NotificationSettings initialReminders={user.remindersEnabled ?? true} />
    </SettingsShell>
  );
}
