import type { MoodKey } from "../constants/moods";
import { MOODS, MONTHS } from "../constants/moods";
import type { AggregatedRow, NormalizedEntry, StoredEntry } from "./types";

const baseMoodCounts = MOODS.reduce<Record<MoodKey, number>>((acc, mood) => {
  acc[mood.key] = 0;
  return acc;
}, {} as Record<MoodKey, number>);

const buildEmptyYear = (): AggregatedRow[] =>
  MONTHS.map((month, monthIndex) => ({
    month,
    monthIndex,
    ...baseMoodCounts,
  }));

export const normalizeEntry = (value: StoredEntry): NormalizedEntry => {
  if (!value) return null;
  const isString = typeof value === "string";
  const isObject = typeof value === "object";

  if (isString) {
    return { first: value as MoodKey, second: null, note: null };
  }
  if (isObject) {
    const first = (value.first ?? value.primary ?? value.mood ?? null) as MoodKey | null;
    const second = (value.second ?? value.secondary ?? null) as MoodKey | null;
    const note = value.note ?? null;
    if (!first && second) {
      return { first: second, second: null, note };
    }
    return {
      first: first ?? null,
      second: second ?? null,
      note,
    };
  }
  return null;
};

export const serializeEntry = ({ first, second, note }: { first: MoodKey | null; second: MoodKey | null; note: string | null }): StoredEntry => {
  if (!first && !note) return null;

  // Note-only entry (no mood yet)
  if (!first) return { note };

  // If there's a note, always return object format
  if (note) {
    return { first, ...(second && { second }), note };
  }

  // Original logic for entries without notes
  if (!second) return first;
  return { first, second };
};

const addMoodCount = (row: AggregatedRow, moodKey: MoodKey | null, weight: number) => {
  if (!moodKey) return;
  if (!Object.prototype.hasOwnProperty.call(row, moodKey)) return;
  const nextValue = (row[moodKey] ?? 0) + weight;
  row[moodKey] = Math.round(nextValue * 100) / 100;
};

export const aggregateYearData = (entries: Record<string, StoredEntry> = {}, year = new Date().getFullYear()) => {
  const template = buildEmptyYear();

  Object.entries(entries).forEach(([dateKey, moodValue]) => {
    const parsed = new Date(dateKey);
    if (Number.isNaN(parsed.getTime())) return;
    if (parsed.getFullYear() !== year) return;
    const monthIndex = parsed.getMonth();
    if (!template[monthIndex]) return;

    const normalized = normalizeEntry(moodValue);
    if (!normalized?.first) return;
    const hasSplit = normalized.second && normalized.second !== normalized.first;

    if (hasSplit) {
      addMoodCount(template[monthIndex], normalized.first, 0.5);
      addMoodCount(template[monthIndex], normalized.second, 0.5);
    } else {
      addMoodCount(template[monthIndex], normalized.first, 1);
    }
  });

  return template;
};

export const hasYearData = (data: AggregatedRow[] = []) => data.some((row) => MOODS.some((mood) => row[mood.key] > 0));
