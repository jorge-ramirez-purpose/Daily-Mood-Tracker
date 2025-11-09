import { MoodLegend } from "./MoodLegend.jsx";
import { InsightPills } from "./InsightPills.jsx";
import { MoodGrid } from "./MoodGrid.jsx";
import { MoodChart } from "./MoodChart.jsx";
import { YearMoodGrid } from "./YearMoodGrid.jsx";
import { hasYearData } from "../utils/data.js";

export const OverviewPanel = ({ data, totalDaysTracked, entries, year, todayKey }) => {
  const hasData = hasYearData(data);

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
            <h3 className="section-title">Year at a glance</h3>
            <YearMoodGrid entries={entries} year={year} todayKey={todayKey} />
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

export default OverviewPanel;
