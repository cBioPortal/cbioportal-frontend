import type { ProfileEntry, ProfileSession, ImportResult } from "./types";

const STORAGE_KEY = "czl:profileHistory";
const MAX_SESSIONS = 50;

export function getProfileHistory(): ProfileSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveProfileSession(url: string, nObs: number, nVar: number, entries: ProfileEntry[]): void {
  const history = getProfileHistory();
  history.unshift({
    url,
    timestamp: Date.now(),
    nObs,
    nVar,
    entries,
  });
  if (history.length > MAX_SESSIONS) history.length = MAX_SESSIONS;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function removeProfileSession(index: number): void {
  const history = getProfileHistory();
  history.splice(index, 1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function clearProfileHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportProfileHistory(): void {
  const history = getProfileHistory();
  const json = JSON.stringify(history, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const a = document.createElement("a");
  a.href = url;
  a.download = `czl-profile-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importProfileHistory(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result as string);
        if (!Array.isArray(imported)) {
          return resolve({ success: false, error: "File does not contain a JSON array" });
        }
        const existing = getProfileHistory();
        const existingKeys = new Set(existing.map((s) => `${s.timestamp}:${s.url}`));
        const newSessions = imported.filter((s: ProfileSession) => !existingKeys.has(`${s.timestamp}:${s.url}`));
        const merged = [...newSessions, ...existing];
        if (merged.length > MAX_SESSIONS) merged.length = MAX_SESSIONS;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        resolve({ success: true, count: newSessions.length });
      } catch {
        resolve({ success: false, error: "Invalid JSON file" });
      }
    };
    reader.onerror = () => resolve({ success: false, error: "Failed to read file" });
    reader.readAsText(file);
  });
}
