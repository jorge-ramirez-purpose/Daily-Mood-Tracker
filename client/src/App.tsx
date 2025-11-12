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
import { parseDateKey } from "./utils/dateHelpers";

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
  const todayKey = getTodayKey();
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);

  useEffect(() => {
    const storage = typeof window === "undefined" ? null : window.localStorage;
    saveEntries(storage, ENTRIES_STORAGE_KEY, entries);
  }, [entries]);

  useEffect(() => {
    if (selectedDateKey === todayKey) return undefined;
    if (typeof window === "undefined" || typeof document === "undefined") return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        setSelectedDateKey(todayKey);
        return;
      }

      const isInsideInteractiveZone = target.closest(".year-grid") || target.closest(".selector");
      if (isInsideInteractiveZone) return;

      setSelectedDateKey(todayKey);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [selectedDateKey, todayKey]);

  const selectedEntry: NormalizedEntry = normalizeEntry(entries[selectedDateKey]) ?? { first: null, second: null };
  const primaryMood = selectedEntry?.first ?? null;
  const secondaryMood = selectedEntry?.second ?? null;
  const isDualDay = Boolean(selectedEntry?.second);
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

  const updateEntryForDate = (dateKey: string, updater: (entry: NonNullable<NormalizedEntry>) => NormalizedEntry) => {
    setEntries((prev) => {
      const normalized: NonNullable<NormalizedEntry> = normalizeEntry(prev[dateKey]) ?? { first: null, second: null };
      const next = updater(normalized);
      if (!next || !next.first) {
        const { [dateKey]: _omitted, ...rest } = prev;
        return rest;
      }
      const serialized = serializeEntry(next);
      if (!serialized) {
        const { [dateKey]: _omit, ...rest } = prev;
        return rest;
      }
      return { ...prev, [dateKey]: serialized };
    });
  };

  const handlePrimarySelect = (moodKey: MoodKey) => {
    updateEntryForDate(selectedDateKey, (entry) => {
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
    updateEntryForDate(selectedDateKey, (entry) => {
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
    updateEntryForDate(selectedDateKey, (entry) => {
      if (!entry.first) return entry;
      return {
        first: entry.first,
        second: checked ? entry.second ?? entry.first : null,
      };
    });
  };

  const selectedDateLabel = useMemo(() => formatTodayLabel(parseDateKey(selectedDateKey)), [selectedDateKey]);

  return (
    <div className="app">
      <div className="app__container">
        <DailyMoodSelector
          moods={MOODS}
          primaryMood={primaryMood}
          secondaryMood={secondaryMood}
          isDual={isDualDay}
          isTodaySelection={selectedDateKey === todayKey}
          onSelectPrimary={handlePrimarySelect}
          onSelectSecondary={handleSecondarySelect}
          onToggleDual={handleToggleDual}
          selectedDateLabel={selectedDateLabel}
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
            selectedDateKey={selectedDateKey}
            onSelectDate={setSelectedDateKey}
          />
        )}
      </div>
    </div>
  );
};

export default App;
