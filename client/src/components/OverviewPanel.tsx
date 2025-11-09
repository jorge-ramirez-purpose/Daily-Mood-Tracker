import { useState } from "react";
import { MoodLegend } from "./MoodLegend";
import { InsightPills } from "./InsightPills";
import { MoodGrid } from "./MoodGrid";
import { MoodChart } from "./MoodChart";
import { YearMoodGrid } from "./YearMoodGrid";
import type { AggregatedRow, StoredEntry } from "../utils/data";
import { hasYearData } from "../utils/data";

type Orientation = "months-first" | "days-first";

type OverviewPanelProps = {
  data: AggregatedRow[];
  totalDaysTracked: number;
  entries: Record<string, StoredEntry>;
  year: number;
  todayKey: string;
};

export const OverviewPanel = ({ data, totalDaysTracked, entries, year, todayKey }: OverviewPanelProps) => {
  const [orientation, setOrientation] = useState<Orientation>("months-first");
  const hasData = hasYearData(data);
  const toggleOrientation = () =>
    setOrientation((prev) => (prev === "months-first" ? "days-first" : "months-first"));
  const toggleLabel = orientation === "months-first" ? "Switch to 31×12" : "Switch to 12×31";

  return (
    <section className="overview">
      <header className="overview__header">
        <div>
          <p className="overview__eyebrow">This year</p>
          <h2 className="overview__title">Mood overview</h2>
        </div>
        <MoodLegend />
      </header>

      <InsightPills data={data} totalDaysTracked={totalDaysTracked} />

      {hasData ? (
        <>
          <div className="overview__panel">
            <div className="overview__panel-header">
              <h3 className="section-title">Year at a glance</h3>
              <button type="button" className="year-grid__toggle" onClick={toggleOrientation}>
                {toggleLabel}
              </button>
            </div>
            <YearMoodGrid entries={entries} year={year} todayKey={todayKey} orientation={orientation} />
          </div>
          <div className="overview__panel">
            <MoodGrid data={data} />
          </div>
          <div className="overview__panel">
            <h3 className="section-title">Distribution by month</h3>
            <MoodChart data={data} />
          </div>
        </>
      ) : (
        <p className="overview__empty">Add a few entries to unlock the yearly insights.</p>
      )}
    </section>
  );
};
