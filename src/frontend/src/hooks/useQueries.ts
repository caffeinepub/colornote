import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Note, UserSettings } from "../backend.d";
import { NoteType } from "../backend.d";
import type { Input, Input__1, Input__2 } from "../backend.d";
import { useActor } from "./useActor";

export function useNotes() {
  const { actor, isFetching } = useActor();
  return useQuery<Note[]>({
    queryKey: ["notes"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getNotes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTrashedNotes() {
  const { actor, isFetching } = useActor();
  return useQuery<Note[]>({
    queryKey: ["trash"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTrashedNotes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSettings() {
  const { actor, isFetching } = useActor();
  return useQuery<UserSettings>({
    queryKey: ["settings"],
    queryFn: async () => {
      if (!actor)
        return {
          theme: "light",
          language: "en",
          viewMode: "grid",
          defaultColor: "yellow",
        };
      return actor.getSettings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateNote() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Input__2) => {
      if (!actor) throw new Error("No actor");
      return actor.createNote(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}

export function useUpdateNote() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Input }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateNote(id, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}

export function useDeleteNote() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteNote(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      qc.invalidateQueries({ queryKey: ["trash"] });
    },
  });
}

export function useRestoreNote() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!actor) throw new Error("No actor");
      return actor.restoreNote(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      qc.invalidateQueries({ queryKey: ["trash"] });
    },
  });
}

export function usePermanentlyDeleteNote() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!actor) throw new Error("No actor");
      return actor.permanentlyDeleteNote(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trash"] }),
  });
}

export function useDuplicateNote() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!actor) throw new Error("No actor");
      return actor.duplicateNote(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}

export function usePinNote() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) => {
      if (!actor) throw new Error("No actor");
      return actor.pinNote(id, pinned);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}

export function useChangeColor() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, color }: { id: string; color: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.changeColor(id, color);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}

export function useSaveSettings() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Input__1) => {
      if (!actor) throw new Error("No actor");
      return actor.saveSettings(input);
    },
    onSuccess: (data) => qc.setQueryData(["settings"], data),
  });
}

export { NoteType };
