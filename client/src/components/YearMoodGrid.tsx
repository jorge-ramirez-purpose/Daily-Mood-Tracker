import { useMemo, type CSSProperties } from "react";
import { MOODS, MONTHS, type MoodKey, type MonthLabel } from "../constants/moods";
import type { NormalizedEntry, StoredEntry } from "../utils/data";
import { normalizeEntry } from "../utils/data";

type Orientation = "months-first" | "days-first";

type DayCell = {
  day: number;
  isDisabled: boolean;
  firstMoodKey: MoodKey | null;
  secondMoodKey: MoodKey | null;
  isToday: boolean;
};

type MonthData = {
  month: MonthLabel;
  days: DayCell[];
};

type YearMoodGridProps = {
  entries: Record<string, StoredEntry>;
  year: number;
  todayKey: string;
  orientation?: Orientation;
};

const colorMap: Record<MoodKey, string> = Object.fromEntries(MOODS.map((mood) => [mood.key, mood.color])) as Record<
  MoodKey,
  string
>;

const pad = (val: number) => String(val).padStart(2, "0");

const daysInMonth = (year: number, monthIndex: number) => new Date(year, monthIndex + 1, 0).getDate();

const buildDay = (
  year: number,
  monthIndex: number,
  dayNumber: number,
  todayKey: string,
  entry: NormalizedEntry
): DayCell => ({
  day: dayNumber,
  isDisabled: false,
  firstMoodKey: entry?.first ?? null,
  secondMoodKey: entry?.second ?? null,
  isToday: `${year}-${pad(monthIndex + 1)}-${pad(dayNumber)}` === todayKey,
});

export const YearMoodGrid = ({ entries = {}, year, todayKey, orientation = "months-first" }: YearMoodGridProps) => {
  const months = useMemo<MonthData[]>(
    () =>
      MONTHS.map((month, monthIndex) => {
        const limit = daysInMonth(year, monthIndex);
        const days: DayCell[] = Array.from({ length: 31 }, (_, dayIndex) => {
          const dayNumber = dayIndex + 1;
          if (dayNumber > limit) {
            return { day: dayNumber, isDisabled: true, firstMoodKey: null, secondMoodKey: null, isToday: false };
          }

          const dateKey = `${year}-${pad(monthIndex + 1)}-${pad(dayNumber)}`;
          const normalized = normalizeEntry(entries[dateKey]);
          return buildDay(year, monthIndex, dayNumber, todayKey, normalized);
        });

        return { month, days };
      }),
    [entries, year, todayKey]
  );

  const renderCell = (monthLabel: MonthLabel, day: DayCell) => {
    const primaryColor = day.firstMoodKey ? colorMap[day.firstMoodKey] : "transparent";
    const secondaryColor =
      day.secondMoodKey && day.secondMoodKey !== day.firstMoodKey ? colorMap[day.secondMoodKey] : null;

    let cellClass = "year-grid__cell";
    if (day.isDisabled) cellClass += " year-grid__cell--disabled";
    else if (!day.firstMoodKey) cellClass += " year-grid__cell--empty";
    if (day.isToday) cellClass += " year-grid__cell--today";
    if (secondaryColor) cellClass += " year-grid__cell--split";

    const style: CSSProperties =
      secondaryColor != null
        ? ({
            "--primary-color": primaryColor,
            "--secondary-color": secondaryColor,
          } as CSSProperties)
        : { background: day.firstMoodKey ? primaryColor : undefined };

    const title = day.isDisabled
      ? "N/A"
      : day.firstMoodKey
      ? secondaryColor
        ? `${monthLabel} ${day.day}: ${day.firstMoodKey} · ${day.secondMoodKey}`
        : `${monthLabel} ${day.day}: ${day.firstMoodKey}`
      : `${monthLabel} ${day.day}: no entry`;

    return <div key={`${monthLabel}-${day.day}`} className={cellClass} title={title} style={style} />;
  };

  const renderMonthsFirst = () => (
    <div className="year-grid__table" style={{ gridTemplateColumns: `90px repeat(31, minmax(26px, 1fr))` }}>
      <div className="year-grid__corner">Month</div>
      {Array.from({ length: 31 }, (_, i) => (
        <div key={`day-header-${i + 1}`} className="year-grid__day-header">
          {i + 1}
        </div>
      ))}

      {months.map(({ month, days }) => (
        <div key={`year-month-${month}`} className="year-grid__row">
          <div className="year-grid__month">{month}</div>
          {days.map((day) => renderCell(month, day))}
        </div>
      ))}
    </div>
  );

  const renderDaysFirst = () => (
    <div
      className="year-grid__table"
      style={{ gridTemplateColumns: `70px repeat(${MONTHS.length}, minmax(48px, 1fr))` }}
    >
      <div className="year-grid__corner">Day</div>
      {MONTHS.map((month) => (
        <div key={`month-header-${month}`} className="year-grid__day-header">
          {month}
        </div>
      ))}

      {Array.from({ length: 31 }, (_, dayIndex) => (
        <div key={`day-row-${dayIndex + 1}`} className="year-grid__row">
          <div className="year-grid__month">{dayIndex + 1}</div>
          {months.map(({ month, days }) => renderCell(month, days[dayIndex]))}
        </div>
      ))}
    </div>
  );

  return <div className="year-grid">{orientation === "months-first" ? renderMonthsFirst() : renderDaysFirst()}</div>;
};
