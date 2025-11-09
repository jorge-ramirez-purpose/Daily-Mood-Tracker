import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { MOODS } from "./constants/moods.js";
import { aggregateYearData } from "./utils/data.js";
import { DailyMoodSelector } from "./components/DailyMoodSelector.jsx";
import { OverviewPanel } from "./components/OverviewPanel.jsx";

const ENTRIES_STORAGE_KEY = "mood-tracker.daily.entries";

const loadEntries = () => {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(ENTRIES_STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
};

const saveEntries = (entries) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(entries));
};

const getTodayKey = () => {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60000;
  const localISO = new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
  return localISO;
};

const formatTodayLabel = () =>
  new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

const App = () => {
  const [entries, setEntries] = useState(() => loadEntries());
  const [showOverview, setShowOverview] = useState(false);

  useEffect(() => {
    saveEntries(entries);
  }, [entries]);

  const todayKey = getTodayKey();
  const todayMood = entries[todayKey] ?? null;
  const currentYear = new Date().getFullYear();

  const yearData = useMemo(() => aggregateYearData(entries, currentYear), [entries, currentYear]);
  const totalDaysTracked = useMemo(
    () =>
      Object.entries(entries).filter(([date]) => {
        const parsed = new Date(date);
        return !Number.isNaN(parsed.getTime()) && parsed.getFullYear() === currentYear;
      }).length,
    [entries, currentYear]
  );

  const handleMoodSelect = (moodKey) => {
    setEntries((prev) => ({ ...prev, [todayKey]: moodKey }));
  };

  return (
    <div className="app">
      <div className="app__container">
        <DailyMoodSelector
          moods={MOODS}
          selectedMood={todayMood}
          onSelect={handleMoodSelect}
          todayLabel={formatTodayLabel()}
        />

        <button type="button" className="overview-toggle" onClick={() => setShowOverview((prev) => !prev)}>
          {showOverview ? "Hide yearly overview" : "Show yearly overview"}
        </button>

        {showOverview && (
          <OverviewPanel
            data={yearData}
            totalDaysTracked={totalDaysTracked}
            entries={entries}
            year={currentYear}
            todayKey={todayKey}
          />
        )}
      </div>
    </div>
  );
};

export default App;
