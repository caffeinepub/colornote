import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { UserSettings } from "../backend.d";
import type { T } from "../i18n";
import type { ViewMode } from "../types";
import ColorPicker from "./ColorPicker";

interface SettingsPanelProps {
  settings: UserSettings;
  t: T;
  onSave: (s: UserSettings) => void;
}

export default function SettingsPanel({
  settings,
  t,
  onSave,
}: SettingsPanelProps) {
  const update = (partial: Partial<UserSettings>) =>
    onSave({ ...settings, ...partial });

  return (
    <div
      className="max-w-lg mx-auto py-8 px-4 space-y-8"
      data-ocid="settings.panel"
    >
      <h2 className="text-xl font-bold text-foreground">{t.settings}</h2>

      {/* Theme */}
      <div className="flex items-center justify-between">
        <Label className="text-base">{t.theme}</Label>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{t.light}</span>
          <Switch
            checked={settings.theme === "dark"}
            onCheckedChange={(v) => update({ theme: v ? "dark" : "light" })}
            data-ocid="settings.theme.switch"
          />
          <span className="text-sm text-muted-foreground">{t.dark}</span>
        </div>
      </div>

      {/* Language */}
      <div className="flex items-center justify-between">
        <Label className="text-base">{t.language}</Label>
        <Select
          value={settings.language}
          onValueChange={(v) => update({ language: v })}
        >
          <SelectTrigger className="w-40" data-ocid="settings.language.select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="el">Ελληνικά</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Default view */}
      <div className="flex items-center justify-between">
        <Label className="text-base">{t.viewMode}</Label>
        <Select
          value={settings.viewMode}
          onValueChange={(v) => update({ viewMode: v })}
        >
          <SelectTrigger className="w-40" data-ocid="settings.viewmode.select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grid">{t.gridView}</SelectItem>
            <SelectItem value="list">{t.listView}</SelectItem>
            <SelectItem value="board">{t.boardView}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Default color */}
      <div>
        <Label className="text-base block mb-3">{t.defaultColor}</Label>
        <ColorPicker
          value={settings.defaultColor}
          onChange={(c) => update({ defaultColor: c })}
        />
      </div>
    </div>
  );
}
