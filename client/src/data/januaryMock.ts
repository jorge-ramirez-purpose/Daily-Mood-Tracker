import type { MoodKey } from "../constants/moods";
import type { StoredEntry } from "../utils/data";

const MOOD_BY_DIGIT: Record<string, MoodKey> = {
  "5": "Great",
  "4": "Good",
  "3": "Okay",
  "2": "Bad",
  "1": "Awful",
};

const padDay = (day: number) => String(day).padStart(2, "0");

const parsePattern = (pattern: string): Array<{ day: number; first: MoodKey; second?: MoodKey }> => {
  const entries: Array<{ day: number; first: MoodKey; second?: MoodKey }> = [];
  let day = 1;

  for (let i = 0; i < pattern.length; i += 1) {
    const char = pattern[i];
    if (char === "(") {
      const firstDigit = pattern[i + 1];
      const secondDigit = pattern[i + 2];
      if (firstDigit && secondDigit) {
        entries.push({
          day,
          first: MOOD_BY_DIGIT[firstDigit],
          second: MOOD_BY_DIGIT[secondDigit],
        });
        day += 1;
      }
      i += 3; // skip digits and closing parenthesis
      continue;
    }

    if (char === ")") continue;

    const mood = MOOD_BY_DIGIT[char];
    if (mood) {
      entries.push({ day, first: mood });
      day += 1;
    }
  }

  return entries;
};

const JANUARY_PATTERN = "543(34)353343534343(53)34454335434433";
const JANUARY_PARSED = parsePattern(JANUARY_PATTERN);

export const buildJanuaryMockMap = (year: number): Record<string, StoredEntry> =>
  JANUARY_PARSED.reduce<Record<string, StoredEntry>>((acc, entry) => {
    const iso = `${year}-01-${padDay(entry.day)}`;
    acc[iso] = entry.second ? { first: entry.first, second: entry.second } : entry.first;
    return acc;
  }, {});
