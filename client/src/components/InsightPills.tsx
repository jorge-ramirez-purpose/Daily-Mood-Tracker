import { MOODS } from "../constants/moods";
import type { AggregatedRow } from "../utils/data";

type InsightPillsProps = {
  data: AggregatedRow[];
  totalDaysTracked: number;
};

export const InsightPills = ({ data, totalDaysTracked }: InsightPillsProps) => {
  if (!data.length) return null;

  const scores = data.map((row) => ({
    month: row.month,
    score: row.Great + row.Good - (row.Bad + row.Awful),
  }));

  const [best] = [...scores].sort((a, b) => b.score - a.score);
  const [worst] = [...scores].sort((a, b) => a.score - b.score);

  const hasEntries = data.some((row) => MOODS.some((mood) => row[mood.key] > 0));

  if (!hasEntries) {
    return (
      <div className="pills pills--empty">
        <span className="pill pill--neutral">Log a few days to unlock insights.</span>
      </div>
    );
  }

  return (
    <div className="pills">
      <span className="pill pill--best">Best: {best?.month ?? "—"}</span>
      <span className="pill pill--tough">Toughest: {worst?.month ?? "—"}</span>
      <span className="pill pill--neutral">Total days tracked: {totalDaysTracked}</span>
    </div>
  );
};
