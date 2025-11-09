export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export type MonthLabel = (typeof MONTHS)[number];

export const MOODS = [
  { key: "Great", color: "#2563eb" },
  { key: "Good", color: "#16a34a" },
  { key: "Okay", color: "#eab308" },
  { key: "Bad", color: "#ef4444" },
  { key: "Awful", color: "#000000" },
] as const;

export type MoodKey = (typeof MOODS)[number]["key"];
export type MoodConfig = (typeof MOODS)[number];
