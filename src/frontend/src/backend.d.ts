import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Input {
    title: string;
    reminder?: bigint;
    body: string;
    color: string;
    tags: Array<string>;
    locked: boolean;
    pinned: boolean;
    checklistItems: Array<ChecklistItem>;
    pinHash?: string;
}
export interface ChecklistItem {
    id: string;
    checked: boolean;
    order: bigint;
    text: string;
}
export interface Input__1 {
    theme: string;
    language: string;
    viewMode: string;
    defaultColor: string;
}
export interface UserSettings {
    theme: string;
    language: string;
    viewMode: string;
    defaultColor: string;
}
export interface Input__2 {
    title: string;
    reminder?: bigint;
    body: string;
    color: string;
    tags: Array<string>;
    locked: boolean;
    noteType: NoteType;
    checklistItems: Array<ChecklistItem>;
    pinHash?: string;
}
export interface UserProfile {
    name: string;
}
export interface Note {
    id: string;
    title: string;
    reminder?: bigint;
    body: string;
    createdAt: bigint;
    color: string;
    tags: Array<string>;
    locked: boolean;
    noteType: NoteType;
    updatedAt: bigint;
    pinned: boolean;
    trashed: boolean;
    checklistItems: Array<ChecklistItem>;
    pinHash?: string;
    trashedAt?: bigint;
}
export enum NoteType {
    text = "text",
    checklist = "checklist"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    changeColor(id: string, color: string): Promise<void>;
    createNote(input: Input__2): Promise<Note>;
    deleteNote(id: string): Promise<void>;
    duplicateNote(id: string): Promise<Note>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getNoteById(id: string): Promise<Note>;
    getNotes(): Promise<Array<Note>>;
    getSettings(): Promise<UserSettings>;
    getTrashedNotes(): Promise<Array<Note>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    permanentlyDeleteNote(id: string): Promise<void>;
    pinNote(id: string, pinned: boolean): Promise<void>;
    restoreNote(id: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveSettings(input: Input__1): Promise<UserSettings>;
    updateNote(id: string, input: Input): Promise<Note>;
}
