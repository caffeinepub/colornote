import type { ChecklistItem, Note, NoteType, UserSettings } from "./backend.d";
export type { Note, ChecklistItem, NoteType, UserSettings };

export type ViewMode = "grid" | "list" | "board";
export type SidebarView =
  | "all"
  | "pinned"
  | "reminders"
  | "trash"
  | "settings"
  | "tag";
export type SortMode = "updated" | "created" | "title" | "color";

export interface AppState {
  view: ViewMode;
  sidebarView: SidebarView;
  activeTag: string | null;
  search: string;
  sort: SortMode;
  sidebarOpen: boolean;
  theme: "light" | "dark";
}
