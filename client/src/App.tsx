import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { MOODS, type MoodKey } from "./constants/moods";
import type { EntriesMap, NormalizedEntry } from "./utils/types";
import { aggregateYearData, normalizeEntry, serializeEntry } from "./utils/data";
import { DailyMoodSelector } from "./components/DailyMoodSelector";
import { OverviewPanel } from "./components/OverviewPanel";
import { YearSelector } from "./components/YearSelector";
import { formatTodayLabel, getTodayKey, loadEntries, saveEntries } from "./utils/appHelpers";
import { parseDateKey } from "./utils/dateHelpers";
import { SettingsMenu } from "./components/SettingsMenu";

const ENTRIES_STORAGE_KEY = "mood-tracker.daily.entries";
const CURRENT_YEAR = new Date().getFullYear();

const App = () => {
  const [entries, setEntries] = useState<EntriesMap>(() =>
    loadEntries(typeof window === "undefined" ? null : window.localStorage, ENTRIES_STORAGE_KEY)
  );
  const [showOverview, setShowOverview] = useState(false);
  const todayKey = getTodayKey();
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);

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

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    Object.keys(entries).forEach((key) => {
      const year = new Date(key).getFullYear();
      if (!Number.isNaN(year)) years.add(year);
    });
    years.add(CURRENT_YEAR);
    return Array.from(years).sort((a, b) => b - a);
  }, [entries]);

  const selectedEntry: NormalizedEntry = normalizeEntry(entries[selectedDateKey]) ?? {
    first: null,
    second: null,
    note: null,
  };
  const primaryMood = selectedEntry?.first ?? null;
  const secondaryMood = selectedEntry?.second ?? null;
  const noteText = selectedEntry?.note ?? null;
  const isDualDay = Boolean(selectedEntry?.second);

  const yearData = useMemo(() => aggregateYearData(entries, selectedYear), [entries, selectedYear]);
  const totalDaysTracked = useMemo(
    () =>
      Object.entries(entries).filter(([date]) => {
        const parsed = new Date(date);
        return !Number.isNaN(parsed.getTime()) && parsed.getFullYear() === selectedYear;
      }).length,
    [entries, selectedYear]
  );

  const updateEntryForDate = (dateKey: string, updater: (entry: NonNullable<NormalizedEntry>) => NormalizedEntry) => {
    setEntries((prev) => {
      const normalized: NonNullable<NormalizedEntry> = normalizeEntry(prev[dateKey]) ?? {
        first: null,
        second: null,
        note: null,
      };
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
        return { first: null, second: null, note: entry.note };
      }
      return {
        first: moodKey,
        second: entry.second,
        note: entry.note,
      };
    });
  };

  const handleSecondarySelect = (moodKey: MoodKey) => {
    updateEntryForDate(selectedDateKey, (entry) => {
      if (entry.second === moodKey) {
        return { first: entry.first, second: null, note: entry.note };
      }
      return {
        first: entry.first ?? moodKey,
        second: moodKey,
        note: entry.note,
      };
    });
  };

  const handleToggleDual = (checked: boolean) => {
    updateEntryForDate(selectedDateKey, (entry) => {
      if (!entry.first) return entry;
      return {
        first: entry.first,
        second: checked ? entry.second ?? entry.first : null,
        note: entry.note,
      };
    });
  };

  const handleNoteChange = (note: string) => {
    updateEntryForDate(selectedDateKey, (entry) => {
      return {
        first: entry.first,
        second: entry.second,
        note: note === "" ? null : note,
      };
    });
  };

  const selectedDateLabel = useMemo(() => formatTodayLabel(parseDateKey(selectedDateKey)), [selectedDateKey]);

  const handleBackup = () => {
    const storage = typeof window === "undefined" ? null : window.localStorage;
    if (!storage) return;

    const backupData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      entries: JSON.parse(storage.getItem(ENTRIES_STORAGE_KEY) || "{}"),
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mood-tracker-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRestore = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (!file.name.endsWith(".json")) {
        alert("Please select a valid JSON file");
        return;
      }

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.entries || typeof data.entries !== "object") {
          alert("Invalid backup file format: missing or invalid entries");
          return;
        }

        const confirmRestore = window.confirm(
          `This will restore ${Object.keys(data.entries).length} entries and replace your current data. Continue?`
        );

        if (!confirmRestore) return;

        const storage = typeof window === "undefined" ? null : window.localStorage;
        if (!storage) return;

        storage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(data.entries));
        setEntries(data.entries);
        setSelectedYear(CURRENT_YEAR);
        setSelectedDateKey(todayKey);
        alert("Data restored successfully!");
      } catch (error) {
        alert(`Failed to restore backup: ${error instanceof Error ? error.message : "Invalid JSON file"}`);
      }
    };
    input.click();
  };

  const handleClear = () => {
    setEntries({});
    setSelectedYear(CURRENT_YEAR);
    setSelectedDateKey(todayKey);
  };

  return (
    <div className="app">
      <SettingsMenu
        onBackup={handleBackup}
        onRestore={handleRestore}
        onClear={handleClear}
        entryCount={Object.keys(entries).length}
      />

      <div className="app__container">
        <DailyMoodSelector
          moods={MOODS}
          primaryMood={primaryMood}
          secondaryMood={secondaryMood}
          isDual={isDualDay}
          isTodaySelection={selectedDateKey === todayKey && selectedYear === CURRENT_YEAR}
          note={noteText}
          onSelectPrimary={handlePrimarySelect}
          onSelectSecondary={handleSecondarySelect}
          onToggleDual={handleToggleDual}
          onNoteChange={handleNoteChange}
          selectedDateLabel={selectedDateLabel}
        />

        <YearSelector
          selectedYear={selectedYear}
          availableYears={availableYears}
          currentYear={CURRENT_YEAR}
          onYearChange={setSelectedYear}
        />

        <button type="button" className="overview-toggle" onClick={() => setShowOverview((prev) => !prev)}>
          {showOverview ? "Hide yearly overview" : "Show yearly overview"}
        </button>

        {showOverview && (
          <OverviewPanel
            data={yearData}
            totalDaysTracked={totalDaysTracked}
            entries={entries}
            year={selectedYear}
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
