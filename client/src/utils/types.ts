import { MonthLabel, MoodKey } from "../constants/moods";

export type StoredEntry =
  | null
  | MoodKey
  | {
      first?: MoodKey | null;
      second?: MoodKey | null;
      primary?: MoodKey | null;
      secondary?: MoodKey | null;
      mood?: MoodKey | null;
      note?: string | null;
    };

export type NormalizedEntry = { first: MoodKey | null; second: MoodKey | null; note: string | null } | null;

export type AggregatedRow = {
  month: MonthLabel;
  monthIndex: number;
} & Record<MoodKey, number>;

export type EntriesMap = Record<string, StoredEntry>;
