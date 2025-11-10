import type { StoredEntry } from "./data";

export type EntriesMap = Record<string, StoredEntry>;

export const getTodayKey = (date: Date = new Date()): string => {
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  const localISO = new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
  return localISO;
};

export const formatTodayLabel = (date: Date = new Date()): string =>
  new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(date);

type StorageLike = Pick<Storage, "getItem" | "setItem"> | null;

export const loadEntries = (storage: StorageLike, storageKey: string, fallback: EntriesMap): EntriesMap => {
  if (!storage) return { ...fallback };
  try {
    const stored = storage.getItem(storageKey);
    if (!stored) return { ...fallback };
    const parsed = JSON.parse(stored) as EntriesMap;
    return parsed && Object.keys(parsed).length > 0 ? parsed : { ...fallback };
  } catch {
    return { ...fallback };
  }
};

export const saveEntries = (storage: StorageLike, storageKey: string, entries: EntriesMap): void => {
  if (!storage) return;
  storage.setItem(storageKey, JSON.stringify(entries));
};
