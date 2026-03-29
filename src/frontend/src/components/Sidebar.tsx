import { cn } from "@/lib/utils";
import {
  Bell,
  Pin,
  Plus,
  Settings,
  StickyNote,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { T } from "../i18n";
import type { SidebarView } from "../types";

const NOTE_COLOR_DOTS: { name: string; hex: string }[] = [
  { name: "Home", hex: "#EF5350" },
  { name: "Work", hex: "#4AA3FF" },
  { name: "Projects", hex: "#5DBB63" },
];

interface SidebarProps {
  open: boolean;
  currentView: SidebarView;
  tags: string[];
  activeTag: string | null;
  t: T;
  onNavigate: (view: SidebarView, tag?: string) => void;
  onClose: () => void;
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
}: SidebarProps) {
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

          {/* Default labels */}
          <div className="pt-4">
            <button
              type="button"
              className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-accent/50 transition-colors"
              data-ocid="sidebar.create_label.button"
            >
              <Plus size={14} />
              {t.createLabel}
            </button>
            {NOTE_COLOR_DOTS.map((d) => (
              <div
                key={d.name}
                className="flex items-center gap-3 px-3 py-1.5 text-sm text-sidebar-foreground"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: d.hex }}
                />
                {d.name}
              </div>
            ))}
          </div>
        </nav>
      </motion.aside>
    </>
  );
}
