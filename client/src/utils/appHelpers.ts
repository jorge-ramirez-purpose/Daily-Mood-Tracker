import type { EntriesMap, StoredEntry } from "./types";

export const getTodayKey = (date: Date = new Date()): string => {
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  const localISO = new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
  return localISO;
};

export const formatTodayLabel = (date: Date = new Date()): string =>
  new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(date);

type StorageLike = Pick<Storage, "getItem" | "setItem"> | null;

export const loadEntries = (storage: StorageLike, storageKey: string): EntriesMap => {
  if (!storage) return {};
  try {
    const stored = storage.getItem(storageKey);
    if (!stored) return {};
    const parsed = JSON.parse(stored) as EntriesMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

export const saveEntries = (storage: StorageLike, storageKey: string, entries: EntriesMap): void => {
  if (!storage) return;
  storage.setItem(storageKey, JSON.stringify(entries));
};
