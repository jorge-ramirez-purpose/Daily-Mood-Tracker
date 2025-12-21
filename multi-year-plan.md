# Multi-Year Architecture Plan for Daily Mood Tracker

## Current State (2024-2025)
- Single year view hardcoded to current year
- All entries stored in one localStorage key: `mood-tracker.daily.entries`
- Data structure: `{ "2025-01-15": "happy", "2025-03-20": { first: "calm", second: "excited" }, ... }`
- Year calculated as: `const CURRENT_YEAR = new Date().getFullYear()`

## Problem Statement
As we approach 2026, users need:
1. Access to historical data from previous years (2024, 2025, etc.)
2. Ability to navigate between years
3. Compare mood patterns across years
4. Maintain performance with growing dataset

## Proposed Architecture

### Option 1: Single Storage with Year Selector (Recommended for Phase 1)

**Advantages:**
- Simple migration path
- Existing data structure works
- Easy backup/restore
- Good performance for ~5-10 years of data

**Implementation:**
```
App State:
- selectedYear: number (defaults to current year)
- entries: EntriesMap (all years, filtered by selectedYear for display)

UI Changes:
- Year selector dropdown/buttons (2024, 2025, 2026...)
- "Current year" indicator
- Previous/Next year navigation

Data Filtering:
- aggregateYearData already filters by year
- DailyMoodSelector shows entries for selectedYear
- OverviewPanel shows stats for selectedYear
```

**Storage remains:**
```json
{
  "mood-tracker.daily.entries": {
    "2024-12-25": "happy",
    "2025-01-01": "excited",
    "2026-01-01": "calm"
  }
}
```

### Option 2: Per-Year Storage Keys

**Advantages:**
- Better performance for 10+ years
- Easier to delete/archive old years
- Cleaner separation

**Implementation:**
```
Storage structure:
- "mood-tracker.daily.entries.2024"
- "mood-tracker.daily.entries.2025"
- "mood-tracker.daily.entries.2026"
- "mood-tracker.metadata" -> { availableYears: [2024, 2025, 2026] }

Loading:
- Load metadata to show available years
- Lazy load specific year when selected
```

### Option 3: Hybrid Approach (Recommended for Phase 2)

**Best of both worlds:**
- Store current year + previous year in single key for fast access
- Archive older years to separate keys
- Automatic migration when new year starts

```javascript
// Fast access (current + last year)
"mood-tracker.daily.entries": {
  "2025-01-01": "happy",
  "2026-01-01": "calm"
}

// Archived years
"mood-tracker.archive.2024": { ... }
"mood-tracker.archive.2023": { ... }
```

## Implementation Phases

### Phase 1: Year Navigation (Minimal Changes)
**Timeline:** Before January 1, 2026
**Effort:** Low
**Files to modify:**
- [App.tsx](client/src/App.tsx) - Add year state and selector UI
- [App.css](client/src/App.css) - Style year selector
- [OverviewPanel.tsx](client/src/components/OverviewPanel.tsx) - Show selected year
- [DailyMoodSelector.tsx](client/src/components/DailyMoodSelector.tsx) - Disable future dates for non-current years

**Changes:**
1. Add year state: `const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR)`
2. Add year selector UI (dropdown or prev/next buttons)
3. Pass selectedYear to components
4. Filter date selection based on selectedYear
5. Update overview title to show "2025 Overview" instead of "Yearly Overview"

**User Experience:**
- Default view: Current year (2026)
- Click "2025" button → View all 2025 data
- Can edit any past date within selected year
- Cannot select future dates in current year
- Cannot select dates in future years

### Phase 2: Storage Optimization
**Timeline:** When data exceeds ~10MB or user has 5+ years
**Effort:** Medium

**Changes:**
1. Implement year-based storage keys
2. Migration script for existing data
3. Lazy loading for archived years
4. Archive older years automatically

### Phase 3: Advanced Features
**Timeline:** User request / nice-to-have
**Effort:** High

**Features:**
- Year comparison view (2024 vs 2025 side-by-side)
- Multi-year trends and charts
- Export specific years
- Import from backup
- Data migration between devices
- Year-end summary/report

## Specific Implementation Plan for Phase 1

### 1. Update App.tsx

```typescript
// Add state
const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);

// Update filtering
const yearData = useMemo(() =>
  aggregateYearData(entries, selectedYear),
  [entries, selectedYear]
);

// Restrict date selection
const canSelectDate = (dateKey: string) => {
  const date = parseDateKey(dateKey);
  if (selectedYear < CURRENT_YEAR) return true; // Can edit any past date
  if (selectedYear === CURRENT_YEAR) return date <= new Date(); // No future dates
  return false; // Cannot select dates in future years
};

// Add year navigation
const availableYears = useMemo(() => {
  const years = new Set<number>();
  Object.keys(entries).forEach(key => {
    const year = new Date(key).getFullYear();
    if (!isNaN(year)) years.add(year);
  });
  // Ensure current year is always available
  years.add(CURRENT_YEAR);
  return Array.from(years).sort((a, b) => b - a); // Descending
}, [entries]);
```

### 2. Add Year Selector Component

Position: Between DailyMoodSelector and overview toggle

```tsx
<div className="year-selector">
  <button
    onClick={() => setSelectedYear(y => y - 1)}
    disabled={selectedYear <= Math.min(...availableYears)}
  >
    ← Previous Year
  </button>

  <div className="year-selector__current">
    {selectedYear}
    {selectedYear === CURRENT_YEAR && <span className="badge">Current</span>}
  </div>

  <button
    onClick={() => setSelectedYear(y => y + 1)}
    disabled={selectedYear >= CURRENT_YEAR}
  >
    Next Year →
  </button>
</div>

{/* OR dropdown version: */}
<select
  value={selectedYear}
  onChange={(e) => setSelectedYear(Number(e.target.value))}
>
  {availableYears.map(year => (
    <option key={year} value={year}>
      {year} {year === CURRENT_YEAR && '(Current)'}
    </option>
  ))}
</select>
```

### 3. Update Date Selection Logic

When user selects a date from the year grid:
```typescript
const handleSelectDate = (dateKey: string) => {
  const date = parseDateKey(dateKey);
  const dateYear = date.getFullYear();

  // Auto-switch year if selecting from different year in overview
  if (dateYear !== selectedYear) {
    setSelectedYear(dateYear);
  }

  setSelectedDateKey(dateKey);
};
```

### 4. Update DailyMoodSelector

Show year context in the selector:
```tsx
<p className="selector__eyebrow">
  {isTodaySelection
    ? `Today · ${selectedDateLabel}`
    : `${selectedDateLabel}, ${selectedYear}`
  }
</p>
```

### 5. Update Overview Title

```tsx
<h2 className="overview__title">
  {selectedYear} Overview
  {selectedYear === CURRENT_YEAR && ' (Current Year)'}
</h2>
```

## Data Migration Considerations

### When transitioning to per-year storage:

```typescript
// Migration function
const migrateToYearBasedStorage = (storage: Storage) => {
  const oldKey = "mood-tracker.daily.entries";
  const allEntries = JSON.parse(storage.getItem(oldKey) || "{}");

  const byYear: Record<number, EntriesMap> = {};

  Object.entries(allEntries).forEach(([dateKey, value]) => {
    const year = new Date(dateKey).getFullYear();
    if (!byYear[year]) byYear[year] = {};
    byYear[year][dateKey] = value;
  });

  // Save each year
  Object.entries(byYear).forEach(([year, entries]) => {
    storage.setItem(`mood-tracker.daily.entries.${year}`, JSON.stringify(entries));
  });

  // Save metadata
  storage.setItem("mood-tracker.metadata", JSON.stringify({
    version: "2.0",
    availableYears: Object.keys(byYear).map(Number),
    migratedAt: new Date().toISOString()
  }));

  // Keep old key for rollback
  storage.setItem(`${oldKey}.backup`, storage.getItem(oldKey)!);
};
```

## Performance Considerations

### Current approach (single storage):
- **Good for:** 1-10 years (~10,000 entries)
- **localStorage limit:** 5-10MB (plenty of room)
- **Estimated size:** 365 entries/year × 10 years × ~100 bytes = ~365KB

### When to migrate to per-year storage:
- User has 10+ years of data
- Performance issues with loading
- User requests ability to delete old years

## Backup/Export Format for Multi-Year

Update backup to be more structured:

```json
{
  "version": "2.0",
  "exportDate": "2025-12-21T10:30:00Z",
  "years": {
    "2024": {
      "2024-01-01": "happy",
      "2024-12-31": "excited"
    },
    "2025": {
      "2025-01-01": "calm",
      "2025-12-31": "grateful"
    }
  },
  "metadata": {
    "totalEntries": 730,
    "yearRange": [2024, 2025],
    "appVersion": "1.0"
  }
}
```

## UI/UX Recommendations

### Year Selector Placement Options:
1. **Floating button next to Backup** (top right)
2. **Above the mood selector** (centered)
3. **In the overview panel** (only shows when overview is visible)
4. **Sticky header** (always visible while scrolling)

### Visual Indicators:
- Gray out future dates in current year
- Show "archived" badge for old years
- Highlight current year in selector
- Show year range in overview (Jan 2025 - Dec 2025)

### Navigation Patterns:
- Keyboard shortcuts: `[` / `]` for prev/next year
- Swipe gestures on mobile
- URL params: `?year=2024` for deep linking
- Remember last selected year in localStorage

## Next Steps

**Immediate (Before 2026):**
1. Implement Phase 1 year selector
2. Test with multi-year data
3. Update backup to include year metadata
4. Add year to overview title

**Future Enhancements:**
1. Import functionality for backups
2. Year comparison features
3. Multi-year analytics
4. Data archival for old years
5. Cloud sync (optional)

## Questions to Consider

1. **Default year on load:** Always current year, or last viewed year?
2. **Year selector style:** Dropdown, buttons, or both?
3. **Date picker:** Allow quick jump to specific year-month?
4. **Archive policy:** Auto-archive years older than X years?
5. **Export options:** Export all years or selected year only?

## Estimated Effort

**Phase 1 (Year Navigation):**
- Development: 4-6 hours
- Testing: 2 hours
- Total: 6-8 hours

**Phase 2 (Storage Optimization):**
- Development: 6-8 hours
- Migration logic: 2-3 hours
- Testing: 3-4 hours
- Total: 11-15 hours

**Phase 3 (Advanced Features):**
- Per feature: 4-20 hours depending on complexity
