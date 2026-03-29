import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import {
  Bell,
  Columns2,
  LayoutGrid,
  List,
  Menu,
  Plus,
  RotateCcw,
  Search,
  StickyNote,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Note } from "./backend.d";
import type { Input as NoteInput, Input__2 as NoteInput2 } from "./backend.d";
import ColorPicker from "./components/ColorPicker";
import NoteCard from "./components/NoteCard";
import NoteEditor from "./components/NoteEditor";
import PinLockDialog from "./components/PinLockDialog";
import SettingsPanel from "./components/SettingsPanel";
import Sidebar from "./components/Sidebar";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  NoteType,
  useChangeColor,
  useCreateNote,
  useDeleteNote,
  useDuplicateNote,
  useNotes,
  usePermanentlyDeleteNote,
  usePinNote,
  useRestoreNote,
  useSaveSettings,
  useSettings,
  useTrashedNotes,
  useUpdateNote,
} from "./hooks/useQueries";
import { type Lang, type T, useTranslation } from "./i18n";
import type { SidebarView, SortMode, ViewMode } from "./types";
import { colorHex, hashPin } from "./utils";
import { getSecretParameter } from "./utils/urlParams";

// ─── Login Screen ───────────────────────────────────────────────────────────
function LoginScreen() {
  const { login, isLoggingIn } = useInternetIdentity();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-indigo-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 w-full max-w-sm text-center space-y-6"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto">
          <StickyNote size={32} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">ColorNote</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Sign in with Internet Identity to keep your notes private and
            secure.
          </p>
        </div>
        <Button
          size="lg"
          className="w-full"
          onClick={login}
          disabled={isLoggingIn}
          data-ocid="login.primary_button"
        >
          {isLoggingIn ? "Signing in…" : "Sign In with Internet Identity"}
        </Button>
      </motion.div>
    </div>
  );
}

// ─── Skeleton Cards ──────────────────────────────────────────────────────────
function SkeletonCards() {
  return (
    <div
      className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4"
      data-ocid="notes.loading_state"
    >
      {Array.from({ length: 6 }, (_, i) => i).map((key) => (
        <Skeleton key={`sk-${key}`} className="h-40 rounded-[14px]" />
      ))}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const { identity, clear, isInitializing } = useInternetIdentity();
  const { actor, isFetching: actorLoading } = useActor();

  const notesQuery = useNotes();
  const trashQuery = useTrashedNotes();
  const settingsQuery = useSettings();

  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const restoreNote = useRestoreNote();
  const permanentDelete = usePermanentlyDeleteNote();
  const duplicateNote = useDuplicateNote();
  const pinNote = usePinNote();
  const changeColor = useChangeColor();
  const saveSettings = useSaveSettings();

  // ── UI State ──────────────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarView, setSidebarView] = useState<SidebarView>("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("updated");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Editor state
  const [editorNote, setEditorNote] = useState<Note | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [newNoteType, setNewNoteType] = useState<NoteType | null>(null);
  const [typePickerOpen, setTypePickerOpen] = useState(false);

  // Pin lock
  const [lockedNote, setLockedNote] = useState<Note | null>(null);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);

  // Color change dialog
  const [colorNote, setColorNote] = useState<Note | null>(null);
  const [colorDialogOpen, setColorDialogOpen] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // ── Settings sync ─────────────────────────────────────────────────────────
  const settings = settingsQuery.data;
  const lang = (settings?.language ?? "en") as Lang;
  const t = useTranslation(lang);
  const theme = settings?.theme ?? "light";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    if (settings?.viewMode) setViewMode(settings.viewMode as ViewMode);
  }, [settings?.viewMode]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const allNotes = notesQuery.data ?? [];
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const n of allNotes) for (const tag of n.tags) tagSet.add(tag);
    return [...tagSet];
  }, [allNotes]);

  const visibleNotes = useMemo(() => {
    let notes = allNotes;
    if (sidebarView === "pinned") notes = notes.filter((n) => n.pinned);
    else if (sidebarView === "reminders")
      notes = notes.filter((n) => !!n.reminder);
    else if (sidebarView === "tag" && activeTag)
      notes = notes.filter((n) => n.tags.includes(activeTag));

    if (search) {
      const q = search.toLowerCase();
      notes = notes.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q) ||
          n.checklistItems.some((i) => i.text.toLowerCase().includes(q)),
      );
    }

    // Sort
    const sorted = [...notes];
    if (sort === "updated")
      sorted.sort((a, b) => Number(b.updatedAt - a.updatedAt));
    else if (sort === "created")
      sorted.sort((a, b) => Number(b.createdAt - a.createdAt));
    else if (sort === "title")
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "color")
      sorted.sort((a, b) => a.color.localeCompare(b.color));

    return sorted;
  }, [allNotes, sidebarView, activeTag, search, sort]);

  const pinnedNotes = visibleNotes.filter((n) => n.pinned);
  const unpinnedNotes = visibleNotes.filter((n) => !n.pinned);

  // ── Helpers ───────────────────────────────────────────────────────────────
  /** Ensure the user is registered in the backend before any write operation. */
  const ensureRegistered = useCallback(async () => {
    if (!actor) throw new Error("Not authenticated");
    const adminToken = getSecretParameter("caffeineAdminToken") ?? "";
    await actor._initializeAccessControlWithSecret(adminToken);
  }, [actor]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const openNote = useCallback((note: Note) => {
    if (note.locked) {
      setLockedNote(note);
      setPinDialogOpen(true);
    } else {
      setEditorNote(note);
      setEditorOpen(true);
    }
  }, []);

  const handleSave = useCallback(
    async (data: NoteInput | NoteInput2, id?: string) => {
      const doSave = async () => {
        if (id) {
          await updateNote.mutateAsync({ id, input: data as NoteInput });
        } else {
          await createNote.mutateAsync(data as NoteInput2);
        }
      };

      try {
        await doSave();
        toast.success("Note saved!");
      } catch {
        // First attempt failed — re-register the user and try once more.
        try {
          await ensureRegistered();
          await doSave();
          toast.success("Note saved!");
        } catch {
          toast.error("Failed to save note.");
        }
      }
    },
    [createNote, updateNote, ensureRegistered],
  );

  const handleDelete = useCallback((note: Note) => {
    setDeleteTarget(note);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteNote.mutateAsync(deleteTarget.id);
      toast.success("Note moved to trash.");
    } catch {
      toast.error("Failed to delete note.");
    }
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  }, [deleteTarget, deleteNote]);

  const handlePin = useCallback(
    async (note: Note) => {
      try {
        await pinNote.mutateAsync({ id: note.id, pinned: !note.pinned });
      } catch {
        toast.error("Failed to pin note.");
      }
    },
    [pinNote],
  );

  const handleDuplicate = useCallback(
    async (note: Note) => {
      try {
        await duplicateNote.mutateAsync(note.id);
        toast.success("Note duplicated.");
      } catch {
        toast.error("Failed to duplicate.");
      }
    },
    [duplicateNote],
  );

  const handleColorChange = useCallback(
    async (color: string) => {
      if (!colorNote) return;
      try {
        await changeColor.mutateAsync({ id: colorNote.id, color });
      } catch {
        toast.error("Failed to change color.");
      }
      setColorDialogOpen(false);
      setColorNote(null);
    },
    [colorNote, changeColor],
  );

  const handleSaveSettings = useCallback(
    async (s: typeof settings) => {
      if (!s) return;
      try {
        await saveSettings.mutateAsync(s);
      } catch {
        toast.error("Failed to save settings.");
      }
    },
    [saveSettings],
  );

  // ── Render ────────────────────────────────────────────────────────────────
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!identity) return <LoginScreen />;

  const principal = identity.getPrincipal().toString();
  const avatarLetter = principal.slice(0, 2).toUpperCase();

  const isLoading = notesQuery.isLoading || actorLoading;
  const trashNotes = trashQuery.data ?? [];

  const gridClass =
    viewMode === "grid"
      ? "grid grid-cols-2 md:grid-cols-3 gap-3"
      : viewMode === "list"
        ? "flex flex-col gap-2"
        : "grid grid-cols-2 md:grid-cols-3 gap-4";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        currentView={sidebarView}
        tags={allTags}
        activeTag={activeTag}
        t={t}
        onNavigate={(view, tag) => {
          setSidebarView(view);
          setActiveTag(tag ?? null);
        }}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 flex items-center gap-3 px-4 border-b border-border bg-background shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            data-ocid="topbar.menu.button"
          >
            <Menu size={20} />
          </button>

          <span className="font-bold text-foreground text-lg hidden sm:block shrink-0">
            {t.appName}
          </span>

          {/* Search */}
          <div className="flex-1 relative max-w-xl">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.search}
              className="pl-9 rounded-full bg-muted border-none focus-visible:ring-1"
              data-ocid="topbar.search.input"
            />
          </div>

          {/* View toggles */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded hover:bg-muted transition-colors",
                viewMode === "grid" ? "text-primary" : "text-muted-foreground",
              )}
              title={t.gridView}
              data-ocid="topbar.grid_view.toggle"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded hover:bg-muted transition-colors",
                viewMode === "list" ? "text-primary" : "text-muted-foreground",
              )}
              title={t.listView}
              data-ocid="topbar.list_view.toggle"
            >
              <List size={18} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("board")}
              className={cn(
                "p-1.5 rounded hover:bg-muted transition-colors",
                viewMode === "board" ? "text-primary" : "text-muted-foreground",
              )}
              title={t.boardView}
              data-ocid="topbar.board_view.toggle"
            >
              <Columns2 size={18} />
            </button>
          </div>

          {/* Sort */}
          <Select value={sort} onValueChange={(v) => setSort(v as SortMode)}>
            <SelectTrigger
              className="w-auto hidden sm:flex border-none bg-muted text-sm h-8"
              data-ocid="topbar.sort.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">{t.sortUpdated}</SelectItem>
              <SelectItem value="created">{t.sortCreated}</SelectItem>
              <SelectItem value="title">{t.sortTitle}</SelectItem>
              <SelectItem value="color">{t.sortColor}</SelectItem>
            </SelectContent>
          </Select>

          {/* New button */}
          <Button
            size="sm"
            className="shrink-0 bg-primary text-white"
            onClick={() => setTypePickerOpen(true)}
            data-ocid="topbar.new_note.primary_button"
          >
            <Plus size={16} className="mr-1" />
            <span className="hidden sm:inline">{t.newNote}</span>
          </Button>

          {/* Avatar */}
          <Avatar
            className="w-8 h-8 cursor-pointer"
            onClick={clear}
            title={t.logout}
          >
            <AvatarFallback className="bg-primary text-white text-xs">
              {avatarLetter}
            </AvatarFallback>
          </Avatar>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Trash view */}
          {sidebarView === "trash" ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg text-foreground">
                  {t.trash}
                </h2>
                {trashNotes.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      await Promise.all(
                        trashNotes.map((n) =>
                          permanentDelete.mutateAsync(n.id),
                        ),
                      );
                      toast.success("Trash emptied.");
                    }}
                    data-ocid="trash.empty_trash.delete_button"
                  >
                    {t.emptyTrash}
                  </Button>
                )}
              </div>
              {isLoading ? (
                <SkeletonCards />
              ) : trashNotes.length === 0 ? (
                <EmptyState
                  icon={<Trash2 size={40} />}
                  text={t.noTrash}
                  ocid="trash.empty_state"
                />
              ) : (
                <div className={gridClass}>
                  <AnimatePresence>
                    {trashNotes.map((note, i) => (
                      <TrashCard
                        key={note.id}
                        note={note}
                        index={i}
                        t={t}
                        onRestore={async () => {
                          await restoreNote.mutateAsync(note.id);
                          toast.success("Note restored.");
                        }}
                        onDelete={async () => {
                          await permanentDelete.mutateAsync(note.id);
                          toast.success("Note permanently deleted.");
                        }}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          ) : sidebarView === "settings" ? (
            <SettingsPanel
              settings={
                settings ?? {
                  theme: "light",
                  language: "en",
                  viewMode: "grid",
                  defaultColor: "yellow",
                }
              }
              t={t}
              onSave={handleSaveSettings}
            />
          ) : (
            // Notes view
            <div
              className={cn("p-4", viewMode === "board" ? "board-view" : "")}
            >
              {/* Page header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg text-foreground">
                  {sidebarView === "pinned"
                    ? t.pinned
                    : sidebarView === "reminders"
                      ? t.reminders
                      : sidebarView === "tag" && activeTag
                        ? `#${activeTag}`
                        : t.allNotes}
                </h2>
              </div>

              {isLoading ? (
                <SkeletonCards />
              ) : visibleNotes.length === 0 ? (
                <EmptyState
                  icon={
                    sidebarView === "pinned" ? (
                      <Bell size={40} />
                    ) : (
                      <StickyNote size={40} />
                    )
                  }
                  text={
                    search
                      ? t.noResults
                      : sidebarView === "pinned"
                        ? t.noPinned
                        : sidebarView === "reminders"
                          ? t.noReminders
                          : t.noNotes
                  }
                  ocid="notes.empty_state"
                />
              ) : (
                <>
                  {/* Pinned section */}
                  {pinnedNotes.length > 0 && sidebarView === "all" && (
                    <div className="mb-6">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        {t.pinnedSection}
                      </p>
                      <div className={gridClass}>
                        <AnimatePresence>
                          {pinnedNotes.map((note, i) => (
                            <NoteCard
                              key={note.id}
                              note={note}
                              view={viewMode}
                              t={t}
                              index={i}
                              onOpen={openNote}
                              onPin={handlePin}
                              onDelete={handleDelete}
                              onDuplicate={handleDuplicate}
                              onColorChange={(n) => {
                                setColorNote(n);
                                setColorDialogOpen(true);
                              }}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  {/* Others section */}
                  {unpinnedNotes.length > 0 && (
                    <div>
                      {pinnedNotes.length > 0 && sidebarView === "all" && (
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          {t.othersSection}
                        </p>
                      )}
                      <div className={gridClass}>
                        <AnimatePresence>
                          {unpinnedNotes.map((note, i) => (
                            <NoteCard
                              key={note.id}
                              note={note}
                              view={viewMode}
                              t={t}
                              index={pinnedNotes.length + i}
                              onOpen={openNote}
                              onPin={handlePin}
                              onDelete={handleDelete}
                              onDuplicate={handleDuplicate}
                              onColorChange={(n) => {
                                setColorNote(n);
                                setColorDialogOpen(true);
                              }}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </main>

        {/* FAB */}
        {sidebarView !== "trash" && sidebarView !== "settings" && (
          <button
            type="button"
            className="fixed bottom-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center z-20"
            onClick={() => setTypePickerOpen(true)}
            data-ocid="fab.new_note.button"
          >
            <Plus size={26} />
          </button>
        )}
      </div>

      {/* Note Type Picker */}
      <Dialog open={typePickerOpen} onOpenChange={setTypePickerOpen}>
        <DialogContent className="max-w-sm" data-ocid="type_picker.dialog">
          <DialogHeader>
            <DialogTitle>{t.chooseNoteType}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <button
              type="button"
              className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-muted hover:border-primary hover:bg-primary/5 transition-colors"
              onClick={() => {
                setNewNoteType(NoteType.text);
                setEditorNote(null);
                setEditorOpen(true);
                setTypePickerOpen(false);
              }}
              data-ocid="type_picker.text_note.button"
            >
              <StickyNote size={32} className="text-primary" />
              <span className="text-sm font-medium">{t.textNote}</span>
            </button>
            <button
              type="button"
              className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-muted hover:border-primary hover:bg-primary/5 transition-colors"
              onClick={() => {
                setNewNoteType(NoteType.checklist);
                setEditorNote(null);
                setEditorOpen(true);
                setTypePickerOpen(false);
              }}
              data-ocid="type_picker.checklist.button"
            >
              <div className="flex flex-col gap-1.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-sm border-2 border-primary" />
                    <div className="w-14 h-2 rounded bg-muted" />
                  </div>
                ))}
              </div>
              <span className="text-sm font-medium">{t.checklistNote}</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Note Editor */}
      {editorOpen && (
        <NoteEditor
          note={editorNote ?? undefined}
          defaultColor={settings?.defaultColor ?? "yellow"}
          defaultType={newNoteType ?? NoteType.text}
          t={t}
          onSave={handleSave}
          onClose={() => {
            setEditorOpen(false);
            setEditorNote(null);
            setNewNoteType(null);
          }}
        />
      )}

      {/* PIN Lock Dialog */}
      <PinLockDialog
        open={pinDialogOpen}
        mode="verify"
        storedHash={lockedNote?.pinHash}
        t={t}
        onVerified={() => {
          setPinDialogOpen(false);
          if (lockedNote) {
            setEditorNote(lockedNote);
            setEditorOpen(true);
          }
          setLockedNote(null);
        }}
        onCancel={() => {
          setPinDialogOpen(false);
          setLockedNote(null);
        }}
      />

      {/* Color Change Dialog */}
      <Dialog open={colorDialogOpen} onOpenChange={setColorDialogOpen}>
        <DialogContent className="max-w-xs" data-ocid="color_change.dialog">
          <DialogHeader>
            <DialogTitle>{t.changeColor}</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <ColorPicker
              value={colorNote?.color ?? "yellow"}
              onChange={handleColorChange}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-ocid="delete_confirm.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Move to Trash?</AlertDialogTitle>
            <AlertDialogDescription>
              This note will be moved to the trash. You can restore it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="delete_confirm.cancel_button">
              {t.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
              data-ocid="delete_confirm.confirm_button"
            >
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster richColors />
    </div>
  );
}

// ─── Trash Card ───────────────────────────────────────────────────────────────
function TrashCard({
  note,
  index,
  t,
  onRestore,
  onDelete,
}: {
  note: Note;
  index: number;
  t: T;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const bg = colorHex(note.color);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-[14px] p-4 note-card-shadow"
      style={{ backgroundColor: bg }}
      data-ocid={`trash.item.${index + 1}`}
    >
      {note.title && (
        <p className="font-semibold text-sm text-[#111827] mb-1">
          {note.title}
        </p>
      )}
      {note.body && (
        <p className="text-xs text-[#111827]/70 line-clamp-3 mb-3">
          {note.body}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-7 text-xs bg-white/50"
          onClick={onRestore}
          data-ocid={`trash.item.${index + 1}.button`}
        >
          <RotateCcw size={11} className="mr-1" />
          {t.restore}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="flex-1 h-7 text-xs"
          onClick={onDelete}
          data-ocid={`trash.item.${index + 1}.delete_button`}
        >
          <Trash2 size={11} className="mr-1" />
          {t.deleteForever}
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyState({
  icon,
  text,
  ocid,
}: { icon: React.ReactNode; text: string; ocid: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 text-muted-foreground"
      data-ocid={ocid}
    >
      <div className="mb-4 opacity-30">{icon}</div>
      <p className="text-sm">{text}</p>
    </div>
  );
}
