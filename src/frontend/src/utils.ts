export const NOTE_COLORS: { name: string; hex: string; label: string }[] = [
  { name: "red", hex: "#EF5350", label: "Red" },
  { name: "orange", hex: "#F59E0B", label: "Orange" },
  { name: "yellow", hex: "#F6E05E", label: "Yellow" },
  { name: "green", hex: "#5DBB63", label: "Green" },
  { name: "teal", hex: "#26A69A", label: "Teal" },
  { name: "blue", hex: "#4AA3FF", label: "Blue" },
  { name: "purple", hex: "#B58AF5", label: "Purple" },
  { name: "grey", hex: "#90A4AE", label: "Grey" },
];

export const COLOR_HEX: Record<string, string> = {
  red: "#EF5350",
  orange: "#F59E0B",
  yellow: "#F6E05E",
  green: "#5DBB63",
  teal: "#26A69A",
  blue: "#4AA3FF",
  purple: "#B58AF5",
  grey: "#90A4AE",
  white: "#FFFFFF",
  default: "#FFFFFF",
};

export function colorHex(name: string): string {
  return COLOR_HEX[name] ?? "#FFFFFF";
}

export function darkenHex(hex: string, amount = 40): string {
  const num = Number.parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function formatDate(ts: bigint | number | undefined): string {
  if (!ts) return "";
  const ms = typeof ts === "bigint" ? Number(ts) / 1_000_000 : Number(ts);
  const d = new Date(ms);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(ts: bigint | undefined): string {
  if (!ts) return "";
  const ms = Number(ts) / 1_000_000;
  const d = new Date(ms);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function nowNano(): bigint {
  return BigInt(Date.now()) * BigInt(1_000_000);
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function hashPin(pin: string): string {
  // Simple deterministic hash for demo purposes
  let h = 5381;
  for (let i = 0; i < pin.length; i++) {
    h = ((h << 5) + h) ^ pin.charCodeAt(i);
    h = h >>> 0;
  }
  return h.toString(16);
}

export function rotationForId(id: string): number {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return ((sum % 7) - 3) * 1.2; // -3.6 to +3.6 degrees
}
