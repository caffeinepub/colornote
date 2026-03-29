import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  Copy,
  Edit3,
  Lock,
  MoreVertical,
  Palette,
  Pin,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Note } from "../backend.d";
import { NoteType } from "../backend.d";
import type { T } from "../i18n";
import type { ViewMode } from "../types";
import { colorHex, formatDate, rotationForId } from "../utils";

interface NoteCardProps {
  note: Note;
  view: ViewMode;
  t: T;
  index: number;
  onOpen: (note: Note) => void;
  onPin: (note: Note) => void;
  onDelete: (note: Note) => void;
  onDuplicate: (note: Note) => void;
  onColorChange: (note: Note) => void;
}

export default function NoteCard({
  note,
  view,
  t,
  index,
  onOpen,
  onPin,
  onDelete,
  onDuplicate,
  onColorChange,
}: NoteCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const bg = colorHex(note.color);
  const rotation = view === "board" ? rotationForId(note.id) : 0;
  const ocidIndex = index + 1;

  const unchecked = note.checklistItems.filter((i) => !i.checked);
  const checked = note.checklistItems.filter((i) => i.checked);

  const cardContent = (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.18 }}
      className={`relative group rounded-[14px] overflow-hidden cursor-pointer select-none ${
        view === "list" ? "flex gap-3 p-3 items-start" : "p-4"
      } ${
        view === "board"
          ? "shadow-lg hover:shadow-xl"
          : "note-card-shadow hover:shadow-lg"
      } transition-shadow`}
      style={{
        backgroundColor: bg,
        transform: view === "board" ? `rotate(${rotation}deg)` : undefined,
      }}
      onClick={() => onOpen(note)}
      data-ocid={`notes.item.${ocidIndex}`}
    >
      {/* Pin indicator */}
      {note.pinned && (
        <div className="absolute top-2 right-8 text-[#111827]/50">
          <Pin size={12} fill="currentColor" />
        </div>
      )}

      {/* Options menu */}
      <div
        role="presentation"
        className={`absolute top-2 right-2 ${menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="p-1 rounded-full hover:bg-black/10 text-[#111827]/50 hover:text-[#111827]"
              data-ocid={`notes.item.${ocidIndex}.open_modal_button`}
            >
              <MoreVertical size={14} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={() => onOpen(note)}
              data-ocid={`notes.item.${ocidIndex}.edit_button`}
            >
              <Edit3 size={14} className="mr-2" />
              {t.edit}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onPin(note)}
              data-ocid={`notes.item.${ocidIndex}.toggle`}
            >
              <Pin size={14} className="mr-2" />
              {note.pinned ? t.unpin : t.pin}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDuplicate(note)}
              data-ocid={`notes.item.${ocidIndex}.button`}
            >
              <Copy size={14} className="mr-2" />
              {t.duplicate}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onColorChange(note)}
              data-ocid={`notes.item.${ocidIndex}.secondary_button`}
            >
              <Palette size={14} className="mr-2" />
              {t.changeColor}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(note)}
              className="text-destructive focus:text-destructive"
              data-ocid={`notes.item.${ocidIndex}.delete_button`}
            >
              <Trash2 size={14} className="mr-2" />
              {t.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      {view === "list" ? (
        <>
          <div
            className="w-3 shrink-0 self-stretch rounded-full mt-1"
            style={{ backgroundColor: bg === "#FFFFFF" ? "#e5e7eb" : bg }}
          />
          <div className="flex-1 min-w-0">
            <NoteCardBody
              note={note}
              unchecked={unchecked}
              checked={checked}
              listView
            />
          </div>
        </>
      ) : (
        <NoteCardBody note={note} unchecked={unchecked} checked={checked} />
      )}
    </motion.div>
  );

  return cardContent;
}

function NoteCardBody({
  note,
  unchecked,
  checked,
  listView,
}: {
  note: Note;
  unchecked: Note["checklistItems"];
  checked: Note["checklistItems"];
  listView?: boolean;
}) {
  const isChecklist = note.noteType === NoteType.checklist;

  // Locked notes: show only the title and lock indicator
  if (note.locked) {
    return (
      <div className="space-y-1">
        {note.title ? (
          <p className="font-semibold text-sm text-[#111827] leading-snug truncate">
            {note.title}
          </p>
        ) : (
          <p className="text-sm text-[#111827]/40 italic">Locked note</p>
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-[#111827]/50">
            {formatDate(note.updatedAt)}
          </span>
          <Lock size={11} className="text-[#111827]/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Title */}
      {note.title && (
        <p className="font-semibold text-sm text-[#111827] leading-snug truncate">
          {note.title}
        </p>
      )}

      {/* Body / Checklist preview */}
      {!isChecklist && note.body && (
        <p
          className={`text-xs text-[#111827]/75 ${listView ? "line-clamp-1" : "line-clamp-4"} leading-relaxed`}
        >
          {note.body}
        </p>
      )}

      {isChecklist && (
        <div className={`space-y-0.5 ${listView ? "" : ""}`}>
          {unchecked.slice(0, 4).map((item) => (
            <div key={item.id} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm border border-[#111827]/40 flex-shrink-0" />
              <span className="text-xs text-[#111827]/75 truncate">
                {item.text}
              </span>
            </div>
          ))}
          {checked.length > 0 && (
            <p className="text-xs text-[#111827]/40 mt-0.5">
              + {checked.length} checked
            </p>
          )}
        </div>
      )}

      {/* Tags */}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {note.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-4 bg-black/10 text-[#111827]/70 border-none"
            >
              #{tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-[#111827]/50">
          {formatDate(note.updatedAt)}
        </span>
        <div className="flex items-center gap-1.5">
          {note.reminder && <Bell size={11} className="text-[#111827]/50" />}
          {note.locked && <Lock size={11} className="text-[#111827]/50" />}
        </div>
      </div>
    </div>
  );
}
