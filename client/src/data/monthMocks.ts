import type { MoodKey } from "../constants/moods";
import type { StoredEntry } from "../utils/types";

const MOOD_BY_DIGIT: Record<string, MoodKey> = {
  "5": "Great",
  "4": "Good",
  "3": "Okay",
  "2": "Bad",
  "1": "Awful",
};

const parsePattern = (pattern: string) => {
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
      i += 3;
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

const buildMonthMockMap = (year: number, monthIndex: number, pattern: string): Record<string, StoredEntry> => {
  const parsed = parsePattern(pattern);
  return parsed.reduce<Record<string, StoredEntry>>((acc, entry) => {
    const iso = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(entry.day).padStart(2, "0")}`;
    acc[iso] = entry.second ? { first: entry.first, second: entry.second } : entry.first;
    return acc;
  }, {});
};

const JANUARY_PATTERN = "543(34)353343534343(53)34454335434433";
const FEBRUARY_PATTERN = "44332333454345(24)3343435544433";
const MARCH_PATTERN = "333344554434434333(34)4(43)4343545454";
const APRIL_PATTERN = "44345434433444443443344234(23)33(34)";
const MAY_PATTERN = "(41)33344434444343444434333433555(54)";
const JUNE_PATTERN = "433(43)44343333424434535433334444";
const JULY_PATTERN = "4333(43)443344434444445(32)(34)53433334";
const AUGUST_PATTERN = "(25)443(42)34434454545(53)44444444333(34)44";
const SEPTEMBER_PATTERN = "433344543334454334545334444554";
const OCTOBER_PATTERN = "5553434334443443433334554444554";
const NOVEMBER_PATTERN = "54444454";

export const buildJanuaryMockMap = (year: number) => buildMonthMockMap(year, 0, JANUARY_PATTERN);
export const buildFebruaryMockMap = (year: number) => buildMonthMockMap(year, 1, FEBRUARY_PATTERN);
export const buildMarchMockMap = (year: number) => buildMonthMockMap(year, 2, MARCH_PATTERN);
export const buildAprilMockMap = (year: number) => buildMonthMockMap(year, 3, APRIL_PATTERN);
export const buildMayMockMap = (year: number) => buildMonthMockMap(year, 4, MAY_PATTERN);
export const buildJuneMockMap = (year: number) => buildMonthMockMap(year, 5, JUNE_PATTERN);
export const buildJulyMockMap = (year: number) => buildMonthMockMap(year, 6, JULY_PATTERN);
export const buildAugustMockMap = (year: number) => buildMonthMockMap(year, 7, AUGUST_PATTERN);
export const buildSeptemberMockMap = (year: number) => buildMonthMockMap(year, 8, SEPTEMBER_PATTERN);
export const buildOctoberMockMap = (year: number) => buildMonthMockMap(year, 9, OCTOBER_PATTERN);
export const buildNovemberMockMap = (year: number) => buildMonthMockMap(year, 10, NOVEMBER_PATTERN);
