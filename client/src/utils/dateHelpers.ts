export const parseDateKey = (key: string, fallbackDate: Date = new Date()): Date => {
  if (!key) {
    return new Date(fallbackDate);
  }

  const [yearString, monthString, dayString] = key.split("-");
  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);

  const parsed = new Date(year, (month || 1) - 1, day || 1);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(fallbackDate);
  }

  return parsed;
};
