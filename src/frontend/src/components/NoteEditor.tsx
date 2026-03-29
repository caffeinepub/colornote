import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Bell,
  GripVertical,
  Lock,
  LockOpen,
  Plus,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ChecklistItem, Note } from "../backend.d";
import { NoteType } from "../backend.d";
import type { Input as NoteInput, Input__2 as NoteInput2 } from "../backend.d";
import type { T } from "../i18n";
import {
  colorHex,
  formatDateTime,
  generateId,
  hashPin,
  nowNano,
} from "../utils";
import ColorPicker from "./ColorPicker";
import PinLockDialog from "./PinLockDialog";

interface NoteEditorProps {
  note?: Note;
  defaultColor?: string;
  defaultType?: NoteType;
  t: T;
  onSave: (data: NoteInput | NoteInput2, id?: string) => void;
  onClose: () => void;
}

export default function NoteEditor({
  note,
  defaultColor = "yellow",
  defaultType = NoteType.text,
  t,
  onSave,
  onClose,
}: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const [color, setColor] = useState(note?.color ?? defaultColor);
  const [tags, setTags] = useState<string[]>(note?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [locked, setLocked] = useState(note?.locked ?? false);
  const [pinHash, setPinHash] = useState(note?.pinHash ?? "");
  const [reminder, setReminder] = useState<string>(
    note?.reminder
      ? new Date(Number(note.reminder) / 1_000_000).toISOString().slice(0, 16)
      : "",
  );
  const [items, setItems] = useState<ChecklistItem[]>(
    note?.checklistItems
      ? [...note.checklistItems].sort((a, b) => {
          if (a.checked !== b.checked) return a.checked ? 1 : -1;
          return Number(a.order) - Number(b.order);
        })
      : [],
  );
  const [newItemText, setNewItemText] = useState("");
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinMode, setPinMode] = useState<"set" | "verify">("set");
  const newItemRef = useRef<HTMLInputElement>(null);
  const isChecklist = (note?.noteType ?? defaultType) === NoteType.checklist;

  const bg = colorHex(color);

  const addItem = useCallback(() => {
    const text = newItemText.trim();
    if (!text) return;
    setItems((prev) => [
      ...prev,
      { id: generateId(), text, checked: false, order: BigInt(prev.length) },
    ]);
    setNewItemText("");
    newItemRef.current?.focus();
  }, [newItemText]);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it)),
    );
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const updateItem = (id: string, text: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, text } : it)));
  };

  const addTag = () => {
    const parts = tagInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const newTags = [...new Set([...tags, ...parts])];
    setTags(newTags);
    setTagInput("");
  };

  const removeTag = (tag: string) =>
    setTags((prev) => prev.filter((t) => t !== tag));

  const handleShare = async () => {
    const text = `${title}\n\n${isChecklist ? items.map((i) => `${i.checked ? "[x]" : "[ ]"} ${i.text}`).join("\n") : body}`;
    if (navigator.share) {
      await navigator.share({ title, text });
      toast.success(t.shared);
    } else {
      await navigator.clipboard.writeText(text);
      toast.success(t.copied);
    }
  };

  const handleLockToggle = () => {
    if (locked) {
      setLocked(false);
      setPinHash("");
    } else {
      setPinMode("set");
      setShowPinDialog(true);
    }
  };

  const handleSave = () => {
    const reminderNano = reminder
      ? BigInt(new Date(reminder).getTime()) * BigInt(1_000_000)
      : undefined;
    if (note) {
      const input: NoteInput = {
        title,
        body: isChecklist ? "" : body,
        color,
        tags,
        locked,
        pinned: note.pinned,
        checklistItems: isChecklist ? items : [],
        pinHash: locked ? pinHash : undefined,
        reminder: reminderNano,
      };
      onSave(input, note.id);
    } else {
      const input: NoteInput2 = {
        title,
        body: isChecklist ? "" : body,
        color,
        tags,
        locked,
        noteType: defaultType,
        checklistItems: isChecklist ? items : [],
        pinHash: locked ? pinHash : undefined,
        reminder: reminderNano,
      };
      onSave(input);
    }
    onClose();
  };

  const uncheckedItems = items.filter((i) => !i.checked);
  const checkedItems = items.filter((i) => i.checked);

  return (
    <>
      <Dialog open onOpenChange={(o) => !o && onClose()}>
        <DialogContent
          className="max-w-2xl w-full p-0 overflow-hidden"
          style={{ background: bg }}
          data-ocid="note_editor.dialog"
        >
          {/* Header */}
          <div
            className="flex items-center gap-2 px-4 pt-4 pb-2"
            style={{ background: bg }}
          >
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.noteTitle}
              className="flex-1 border-none shadow-none bg-transparent text-[#111827] placeholder:text-[#111827]/50 text-lg font-semibold focus-visible:ring-0 px-0"
              data-ocid="note_editor.title.input"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="shrink-0 text-[#111827]/60"
            >
              <X size={18} />
            </Button>
          </div>

          <div
            className="px-4 pb-2 overflow-y-auto max-h-[60vh]"
            style={{ background: bg }}
          >
            {/* Body or Checklist */}
            {!isChecklist ? (
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t.noteBody}
                className="border-none shadow-none bg-transparent text-[#111827] placeholder:text-[#111827]/50 resize-none min-h-[180px] focus-visible:ring-0 px-0 text-sm"
                data-ocid="note_editor.textarea"
              />
            ) : (
              <div className="space-y-1 py-1">
                {/* Unchecked */}
                {uncheckedItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 group">
                    <GripVertical
                      size={14}
                      className="text-[#111827]/30 cursor-grab"
                    />
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={() => toggleItem(item.id)}
                      className="border-[#111827]/40"
                    />
                    <input
                      value={item.text}
                      onChange={(e) => updateItem(item.id, e.target.value)}
                      className="flex-1 bg-transparent text-[#111827] text-sm outline-none border-b border-transparent focus:border-[#111827]/20"
                    />
                    <button
                      type="button"
                      onClick={() => deleteItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-[#111827]/40 hover:text-destructive transition-opacity"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}

                {/* Add item */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-3.5" />
                  <Plus size={14} className="text-[#111827]/50" />
                  <input
                    ref={newItemRef}
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addItem()}
                    placeholder={t.newItem}
                    className="flex-1 bg-transparent text-[#111827]/70 text-sm outline-none placeholder:text-[#111827]/40"
                    data-ocid="note_editor.add_item.input"
                  />
                  {newItemText && (
                    <button
                      type="button"
                      onClick={addItem}
                      className="text-xs text-[#111827]/60"
                    >
                      {t.addItem}
                    </button>
                  )}
                </div>

                {/* Checked items */}
                {checkedItems.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-[#111827]/50 mb-1">
                      {t.checkedItems}
                    </p>
                    {checkedItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 group opacity-60"
                      >
                        <div className="w-3.5" />
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={() => toggleItem(item.id)}
                          className="border-[#111827]/40"
                        />
                        <span className="flex-1 text-sm text-[#111827] line-through">
                          {item.text}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 text-[#111827]/40 hover:text-destructive transition-opacity"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            <div className="mt-3">
              <div className="flex flex-wrap gap-1 mb-1">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs bg-black/10 text-[#111827] hover:bg-black/20 cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    #{tag} <X size={10} className="ml-1" />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-1">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder={`${t.tags} (comma separated)`}
                  className="flex-1 bg-transparent text-[#111827] text-xs outline-none placeholder:text-[#111827]/40 border-b border-[#111827]/20 pb-0.5"
                  data-ocid="note_editor.tags.input"
                />
              </div>
            </div>

            {/* Reminder */}
            <div className="mt-3 flex items-center gap-2">
              <Bell size={14} className="text-[#111827]/50" />
              <input
                type="datetime-local"
                value={reminder}
                onChange={(e) => setReminder(e.target.value)}
                className="bg-transparent text-[#111827] text-xs outline-none"
                data-ocid="note_editor.reminder.input"
              />
              {reminder && (
                <button
                  type="button"
                  onClick={() => setReminder("")}
                  className="text-[#111827]/40"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Bottom toolbar */}
          <div
            className="flex items-center justify-between px-4 py-3 border-t border-black/10"
            style={{ background: bg }}
          >
            <ColorPicker value={color} onChange={setColor} />
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLockToggle}
                className={cn(
                  "text-[#111827]/60 hover:text-[#111827]",
                  locked && "text-[#111827]",
                )}
                title={t.lock}
                data-ocid="note_editor.lock.toggle"
              >
                {locked ? <Lock size={16} /> : <LockOpen size={16} />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                className="text-[#111827]/60 hover:text-[#111827]"
                title={t.share}
                data-ocid="note_editor.share.button"
              >
                <Share2 size={16} />
              </Button>
              <Button
                variant="ghost"
                className="text-[#111827]/70 hover:text-[#111827] text-sm font-medium"
                onClick={onClose}
                data-ocid="note_editor.cancel_button"
              >
                {t.cancel}
              </Button>
              <Button
                className="bg-primary text-white text-sm font-medium"
                onClick={handleSave}
                data-ocid="note_editor.save.submit_button"
              >
                {t.save}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PinLockDialog
        open={showPinDialog}
        mode={pinMode}
        storedHash={pinHash}
        t={t}
        onVerified={(pin) => {
          setLocked(true);
          setPinHash(hashPin(pin));
          setShowPinDialog(false);
        }}
        onCancel={() => setShowPinDialog(false)}
      />
    </>
  );
}
