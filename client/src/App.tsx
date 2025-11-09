import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { MOODS, type MoodKey } from "./constants/moods";
import type { NormalizedEntry, StoredEntry } from "./utils/data";
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

type EntriesMap = Record<string, StoredEntry>;

const loadEntries = (): EntriesMap => {
  if (typeof window === "undefined") return { ...DEFAULT_ENTRIES };
  try {
    const stored = JSON.parse(window.localStorage.getItem(ENTRIES_STORAGE_KEY) ?? "{}") as EntriesMap;
    if (!stored || Object.keys(stored).length === 0) return { ...DEFAULT_ENTRIES };
    return stored;
  } catch {
    return { ...DEFAULT_ENTRIES };
  }
};

const saveEntries = (entries: EntriesMap) => {
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
  const [entries, setEntries] = useState<EntriesMap>(() => loadEntries());
  const [showOverview, setShowOverview] = useState(false);

  useEffect(() => {
    saveEntries(entries);
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
    updateTodayEntry((entry) => ({
      first: moodKey,
      second: entry.second,
    }));
  };

  const handleSecondarySelect = (moodKey: MoodKey) => {
    updateTodayEntry((entry) => ({
      first: entry.first ?? moodKey,
      second: moodKey,
    }));
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
