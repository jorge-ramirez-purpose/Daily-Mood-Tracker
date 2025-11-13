import test from "node:test";
import assert from "node:assert/strict";
import { formatTodayLabel, getTodayKey, loadEntries, saveEntries } from "../appHelpers";
import type { EntriesMap } from "../types";

const createMockStorage = (initial: Record<string, string> = {}) => {
  const store = { ...initial };
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    dump: () => ({ ...store }),
  } as const;
};

test("getTodayKey returns ISO date adjusted for timezone", () => {
  const mockDate = new Date("2024-03-05T12:00:00Z");
  // Use same date regardless of runtime timezone by passing explicit Date
  const key = getTodayKey(mockDate);
  assert.equal(key, "2024-03-05");
});

test("formatTodayLabel formats using en-US long form", () => {
  const mockDate = new Date("2024-10-10T09:00:00Z");
  const label = formatTodayLabel(mockDate);
  assert.equal(label, "Thursday, October 10");
});

test("loadEntries falls back when storage empty or missing", () => {
  const fallback: EntriesMap = { "2024-01-01": "Great" };
  const storage = createMockStorage();
  const result = loadEntries(storage, "key", fallback);
  assert.deepEqual(result, fallback);

  const noStorage = loadEntries(null, "key", fallback);
  assert.deepEqual(noStorage, fallback);
});

test("loadEntries parses stored data when available", () => {
  const fallback: EntriesMap = { "2024-01-01": "Great" };
  const stored: EntriesMap = { "2024-02-01": "Good" };
  const storage = createMockStorage({ key: JSON.stringify(stored) });
  const result = loadEntries(storage, "key", fallback);
  assert.deepEqual(result, stored);
});

test("saveEntries writes JSON to storage", () => {
  const storage = createMockStorage();
  const entries: EntriesMap = { "2024-03-02": { first: "Okay", second: "Good" } };
  saveEntries(storage, "entries", entries);
  assert.deepEqual(storage.dump(), { entries: JSON.stringify(entries) });
});
