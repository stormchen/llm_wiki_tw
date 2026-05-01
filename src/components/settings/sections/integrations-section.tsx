import { useTranslation } from "react-i18next"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { SettingsDraft, DraftSetter } from "../settings-types"

interface Props {
  draft: SettingsDraft
  setDraft: DraftSetter
}

export function IntegrationsSection({ draft, setDraft }: Props) {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("settings.sections.integrations.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("settings.sections.integrations.description")}
        </p>
      </div>

      <div className="space-y-2">
        <Label>{t("settings.sections.integrations.notionApiKey")}</Label>
        <p className="text-xs text-muted-foreground">
          {t("settings.sections.integrations.notionApiKeyHint")}
        </p>
        <Input
          type="password"
          value={draft.notionApiKey}
          onChange={(e) => setDraft("notionApiKey", e.target.value)}
          placeholder="secret_..."
          className="font-mono text-xs"
        />
      </div>
    </div>
  )
}
