import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { MOODS, type MoodKey } from "./constants/moods";
import type { NormalizedEntry } from "./utils/data";
import { aggregateYearData, normalizeEntry, serializeEntry } from "./utils/data";
import { DailyMoodSelector } from "./components/DailyMoodSelector";
import { OverviewPanel } from "./components/OverviewPanel";
import {
  buildJanuaryMockMap,
  buildFebruaryMockMap,
  buildMarchMockMap,
  buildAprilMockMap,
  buildMayMockMap,
  buildJuneMockMap,
  buildJulyMockMap,
  buildAugustMockMap,
  buildSeptemberMockMap,
  buildOctoberMockMap,
  buildNovemberMockMap,
} from "./data/monthMocks";
import { formatTodayLabel, getTodayKey, loadEntries, saveEntries, type EntriesMap } from "./utils/appHelpers";

const ENTRIES_STORAGE_KEY = "mood-tracker.daily.entries";
const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_ENTRIES = {
  ...buildJanuaryMockMap(CURRENT_YEAR),
  ...buildFebruaryMockMap(CURRENT_YEAR),
  ...buildMarchMockMap(CURRENT_YEAR),
  ...buildAprilMockMap(CURRENT_YEAR),
  ...buildMayMockMap(CURRENT_YEAR),
  ...buildJuneMockMap(CURRENT_YEAR),
  ...buildJulyMockMap(CURRENT_YEAR),
  ...buildAugustMockMap(CURRENT_YEAR),
  ...buildSeptemberMockMap(CURRENT_YEAR),
  ...buildOctoberMockMap(CURRENT_YEAR),
  ...buildNovemberMockMap(CURRENT_YEAR),
};

const App = () => {
  const [entries, setEntries] = useState<EntriesMap>(() =>
    loadEntries(typeof window === "undefined" ? null : window.localStorage, ENTRIES_STORAGE_KEY, DEFAULT_ENTRIES)
  );
  const [showOverview, setShowOverview] = useState(false);

  useEffect(() => {
    const storage = typeof window === "undefined" ? null : window.localStorage;
    saveEntries(storage, ENTRIES_STORAGE_KEY, entries);
  }, [entries]);

  const todayKey = getTodayKey();
  const todayEntry: NormalizedEntry = normalizeEntry(entries[todayKey]) ?? { first: null, second: null };
  const primaryMood = todayEntry?.first ?? null;
  const secondaryMood = todayEntry?.second ?? null;
  const isDualDay = Boolean(todayEntry?.second);
  const currentYear = CURRENT_YEAR;

  const yearData = useMemo(() => aggregateYearData(entries, currentYear), [entries, currentYear]);
  const totalDaysTracked = useMemo(
    () =>
      Object.entries(entries).filter(([date]) => {
        const parsed = new Date(date);
        return !Number.isNaN(parsed.getTime()) && parsed.getFullYear() === currentYear;
      }).length,
    [entries, currentYear]
  );

  const updateTodayEntry = (updater: (entry: NonNullable<NormalizedEntry>) => NormalizedEntry) => {
    setEntries((prev) => {
      const normalized: NonNullable<NormalizedEntry> = normalizeEntry(prev[todayKey]) ?? { first: null, second: null };
      const next = updater(normalized);
      if (!next || !next.first) {
        const { [todayKey]: _omitted, ...rest } = prev;
        return rest;
      }
      const serialized = serializeEntry(next);
      if (!serialized) {
        const { [todayKey]: _omit, ...rest } = prev;
        return rest;
      }
      return { ...prev, [todayKey]: serialized };
    });
  };

  const handlePrimarySelect = (moodKey: MoodKey) => {
    updateTodayEntry((entry) => {
      if (entry.first === moodKey) {
        return { first: null, second: null };
      }
      return {
        first: moodKey,
        second: entry.second,
      };
    });
  };

  const handleSecondarySelect = (moodKey: MoodKey) => {
    updateTodayEntry((entry) => {
      if (entry.second === moodKey) {
        return { first: entry.first, second: null };
      }
      return {
        first: entry.first ?? moodKey,
        second: moodKey,
      };
    });
  };

  const handleToggleDual = (checked: boolean) => {
    updateTodayEntry((entry) => {
      if (!entry.first) return entry;
      return {
        first: entry.first,
        second: checked ? entry.second ?? entry.first : null,
      };
    });
  };

  return (
    <div className="app">
      <div className="app__container">
        <DailyMoodSelector
          moods={MOODS}
          primaryMood={primaryMood}
          secondaryMood={secondaryMood}
          isDual={isDualDay}
          onSelectPrimary={handlePrimarySelect}
          onSelectSecondary={handleSecondarySelect}
          onToggleDual={handleToggleDual}
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
