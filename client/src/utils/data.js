import { MOODS, MONTHS } from "../constants/moods.js";

const buildEmptyYear = () =>
  MONTHS.map((month, monthIndex) => ({
    month,
    monthIndex,
    ...Object.fromEntries(MOODS.map((mood) => [mood.key, 0])),
  }));

export const normalizeEntry = (value) => {
  if (!value) return null;
  const isString = typeof value === "string";
  const isObject = typeof value === "object";

  if (isString) {
    return { first: value, second: null };
  }
  if (isObject) {
    const first = value.first ?? value.primary ?? value.mood ?? null;
    const second = value.second ?? value.secondary ?? null;
    if (!first && second) {
      return { first: second, second: null };
    }
    return {
      first: first ?? null,
      second: second ?? null,
    };
  }
  return null;
};

export const serializeEntry = ({ first, second }) => {
  if (!first) return null;
  if (!second) return first;
  return { first, second };
};

const addMoodCount = (row, moodKey, weight) => {
  if (!moodKey) return;
  if (!Object.prototype.hasOwnProperty.call(row, moodKey)) return;
  const nextValue = (row[moodKey] ?? 0) + weight;
  row[moodKey] = Math.round(nextValue * 100) / 100;
};

export const aggregateYearData = (entries = {}, year = new Date().getFullYear()) => {
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

export const hasYearData = (data = []) => data.some((row) => MOODS.some((mood) => row[mood.key] > 0));
