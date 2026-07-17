import { requireCurrentUser } from "@/lib/auth";
import { PlatformPreferences } from "@/components/PlatformPreferences";
import { SettingsShell } from "@/components/SettingsShell";
import { Palette } from "lucide-react";
import { getServerT } from "@/lib/i18n-server";

export default async function PreferencesPage() {
  const user = await requireCurrentUser();
  const { t } = await getServerT();

  return (
    <SettingsShell title={t("Preferencias")} description={t("Ajustes de visualización, avisos y privacidad.")} icon={<Palette className="h-7 w-7" />}>
      <PlatformPreferences
        initial={{
          compactMode: user.compactMode ?? false,
          remindersEnabled: user.remindersEnabled ?? true,
          exportJsonByDefault: user.exportJsonByDefault ?? true,
          privacyMode: user.privacyMode ?? false,
        }}
      />
    </SettingsShell>
  );
}
