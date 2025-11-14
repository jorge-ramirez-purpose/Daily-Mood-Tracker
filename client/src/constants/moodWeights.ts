import type { MoodKey } from "./moods";

export const MOOD_WEIGHTS: Record<MoodKey, number> = {
  Great: 2,
  Good: 1,
  Okay: 0.5,
  Bad: -1,
  Awful: -2,
};
