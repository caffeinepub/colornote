import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Bell,
  Pencil,
  Pin,
  Plus,
  Settings,
  StickyNote,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Label } from "../backend.d";
import type { T } from "../i18n";
import type { SidebarView } from "../types";

const PRESET_COLORS = [
  "#EF5350",
  "#E91E63",
  "#9C27B0",
  "#3F51B5",
  "#4AA3FF",
  "#009688",
  "#5DBB63",
  "#FF9800",
  "#795548",
  "#607D8B",
];

interface SidebarProps {
  open: boolean;
  currentView: SidebarView;
  tags: string[];
  activeTag: string | null;
  t: T;
  onNavigate: (view: SidebarView, tag?: string) => void;
  onClose: () => void;
  labels: Label[];
  activeLabel: Label | null;
  onCreateLabel: (input: { name: string; color: string }) => Promise<void>;
  onUpdateLabel: (
    id: string,
    input: { name: string; color: string },
  ) => Promise<void>;
  onDeleteLabel: (id: string) => Promise<void>;
  onNavigateLabel: (label: Label) => void;
}

const NAV_ITEMS: {
  key: SidebarView;
  icon: React.ReactNode;
  labelKey: keyof T;
}[] = [
  { key: "all", icon: <StickyNote size={18} />, labelKey: "allNotes" },
  { key: "pinned", icon: <Pin size={18} />, labelKey: "pinned" },
  { key: "reminders", icon: <Bell size={18} />, labelKey: "reminders" },
  { key: "trash", icon: <Trash2 size={18} />, labelKey: "trash" },
  { key: "settings", icon: <Settings size={18} />, labelKey: "settings" },
];

export default function Sidebar({
  open,
  currentView,
  tags,
  activeTag,
  t,
  onNavigate,
  onClose,
  labels,
  activeLabel,
  onCreateLabel,
  onUpdateLabel,
  onDeleteLabel,
  onNavigateLabel,
}: SidebarProps) {
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [labelName, setLabelName] = useState("");
  const [labelColor, setLabelColor] = useState(PRESET_COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);

  const openCreateDialog = () => {
    setEditingLabel(null);
    setLabelName("");
    setLabelColor(PRESET_COLORS[0]);
    setLabelDialogOpen(true);
  };

  const openEditDialog = (label: Label) => {
    setEditingLabel(label);
    setLabelName(label.name);
    setLabelColor(label.color);
    setLabelDialogOpen(true);
  };

  const closeDialog = () => {
    setLabelDialogOpen(false);
    setEditingLabel(null);
    setLabelName("");
    setLabelColor(PRESET_COLORS[0]);
    setIsSaving(false);
  };

  const handleSave = async () => {
    if (!labelName.trim()) return;
    setIsSaving(true);
    try {
      if (editingLabel) {
        await onUpdateLabel(editingLabel.id, {
          name: labelName.trim(),
          color: labelColor,
        });
      } else {
        await onCreateLabel({ name: labelName.trim(), color: labelColor });
      }
      closeDialog();
    } catch {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingLabel) return;
    setIsSaving(true);
    try {
      await onDeleteLabel(editingLabel.id);
      closeDialog();
    } catch {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 bg-black/30 z-30 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={cn(
          "fixed left-0 top-0 bottom-0 z-40 w-[248px] bg-sidebar flex flex-col py-4 overflow-y-auto",
          "border-r border-sidebar-border shadow-sm",
          "lg:relative lg:z-auto lg:translate-x-0",
        )}
        initial={false}
        animate={{ x: open ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        data-ocid="sidebar.panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <StickyNote size={16} className="text-white" />
            </div>
            <span className="font-bold text-sidebar-foreground text-lg">
              {t.appName}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <button
              type="button"
              key={item.key}
              onClick={() => {
                onNavigate(item.key);
                onClose();
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                currentView === item.key
                  ? "bg-accent text-accent-foreground"
                  : "text-sidebar-foreground hover:bg-accent/50",
              )}
              data-ocid={`sidebar.${item.key}.link`}
            >
              <span
                className={
                  currentView === item.key
                    ? "text-primary"
                    : "text-muted-foreground"
                }
              >
                {item.icon}
              </span>
              {t[item.labelKey] as string}
            </button>
          ))}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="pt-4">
              <div className="flex items-center gap-2 px-3 mb-1">
                <Tag size={13} className="text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Tags
                </span>
              </div>
              {tags.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => {
                    onNavigate("tag", tag);
                    onClose();
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-colors",
                    currentView === "tag" && activeTag === tag
                      ? "bg-accent text-accent-foreground"
                      : "text-sidebar-foreground hover:bg-accent/50",
                  )}
                  data-ocid="sidebar.tag.link"
                >
                  <div className="w-2 h-2 rounded-full bg-primary/60" />#{tag}
                </button>
              ))}
            </div>
          )}

          {/* Labels */}
          <div className="pt-4">
            <div className="flex items-center gap-2 px-3 mb-1">
              <Tag size={13} className="text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t.labels}
              </span>
            </div>

            {labels.length === 0 ? (
              <p className="px-3 py-1.5 text-xs text-muted-foreground">
                {t.noLabels}
              </p>
            ) : (
              labels.map((label) => (
                <div
                  key={label.id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-colors group",
                    currentView === "label" && activeLabel?.id === label.id
                      ? "bg-accent text-accent-foreground"
                      : "text-sidebar-foreground hover:bg-accent/50",
                  )}
                >
                  <button
                    type="button"
                    className="flex-1 flex items-center gap-3 min-w-0 text-left"
                    onClick={() => onNavigateLabel(label)}
                    data-ocid="sidebar.label.link"
                  >
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="truncate">{label.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditDialog(label)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground shrink-0"
                    data-ocid="sidebar.label.edit_button"
                    title={t.editLabel}
                  >
                    <Pencil size={13} />
                  </button>
                </div>
              ))
            )}

            <button
              type="button"
              onClick={openCreateDialog}
              className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-accent/50 transition-colors mt-1"
              data-ocid="sidebar.create_label.button"
            >
              <Plus size={14} />
              {t.createLabel}
            </button>
          </div>
        </nav>
      </motion.aside>

      {/* Label Dialog */}
      <Dialog
        open={labelDialogOpen}
        onOpenChange={(o) => {
          if (!o) closeDialog();
        }}
      >
        <DialogContent className="max-w-sm" data-ocid="label.dialog">
          <DialogHeader>
            <DialogTitle>
              {editingLabel ? t.editLabel : t.createLabel}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="label-name-input"
                className="text-sm font-medium text-foreground"
              >
                {t.labelName}
              </label>
              <Input
                id="label-name-input"
                value={labelName}
                onChange={(e) => setLabelName(e.target.value)}
                placeholder={t.labelName}
                data-ocid="label.input"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
              />
            </div>

            {/* Color picker */}
            <div className="space-y-1.5">
              <span className="text-sm font-medium text-foreground">
                {t.labelColor}
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((hex) => (
                  <button
                    type="button"
                    key={hex}
                    onClick={() => setLabelColor(hex)}
                    className={cn(
                      "w-7 h-7 rounded-full transition-all",
                      labelColor === hex
                        ? "ring-2 ring-offset-2 ring-foreground scale-110"
                        : "hover:scale-105",
                    )}
                    style={{ backgroundColor: hex }}
                    title={hex}
                  />
                ))}
                {/* Custom color */}
                <label
                  className="w-7 h-7 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center cursor-pointer hover:border-muted-foreground transition-colors"
                  title="Custom color"
                >
                  <span className="text-xs text-muted-foreground">+</span>
                  <input
                    type="color"
                    value={labelColor}
                    onChange={(e) => setLabelColor(e.target.value)}
                    className="sr-only"
                    data-ocid="label.select"
                  />
                </label>
              </div>
              {/* Preview */}
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: labelColor }}
                />
                <span className="text-xs text-muted-foreground">
                  {labelColor}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            {editingLabel && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isSaving}
                data-ocid="label.delete_button"
              >
                {t.deleteLabel}
              </Button>
            )}
            <div className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={closeDialog}
              disabled={isSaving}
              data-ocid="label.cancel_button"
            >
              {t.cancel}
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !labelName.trim()}
              data-ocid="label.save_button"
            >
              {isSaving ? "…" : t.save}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
