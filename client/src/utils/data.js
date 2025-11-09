import { MOODS, MONTHS } from "../constants/moods.js";

const buildEmptyYear = () =>
  MONTHS.map((month, monthIndex) => ({
    month,
    monthIndex,
    ...Object.fromEntries(MOODS.map((mood) => [mood.key, 0])),
  }));

export const aggregateYearData = (entries = {}, year = new Date().getFullYear()) => {
  const template = buildEmptyYear();

  Object.entries(entries).forEach(([dateKey, moodKey]) => {
    const parsed = new Date(dateKey);
    if (Number.isNaN(parsed.getTime())) return;
    if (parsed.getFullYear() !== year) return;
    const monthIndex = parsed.getMonth();
    if (!template[monthIndex] || !MOODS.some((mood) => mood.key === moodKey)) return;
    template[monthIndex][moodKey] += 1;
  });

  return template;
};

export const hasYearData = (data = []) => data.some((row) => MOODS.some((mood) => row[mood.key] > 0));
