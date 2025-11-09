import { useMemo } from "react";
import { MOODS, MONTHS } from "../constants/moods.js";

const moodColorMap = Object.fromEntries(MOODS.map((mood) => [mood.key, mood.color]));

const pad = (val) => String(val).padStart(2, "0");

const daysInMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 0).getDate();

export const YearMoodGrid = ({ entries = {}, year, todayKey }) => {
  const months = useMemo(
    () =>
      MONTHS.map((month, monthIndex) => {
        const limit = daysInMonth(year, monthIndex);
        const days = Array.from({ length: 31 }, (_, dayIndex) => {
          const dayNumber = dayIndex + 1;
          if (dayNumber > limit) {
            return { day: dayNumber, isDisabled: true };
          }

          const dateKey = `${year}-${pad(monthIndex + 1)}-${pad(dayNumber)}`;
          const moodKey = entries[dateKey] ?? null;
          return {
            day: dayNumber,
            dateKey,
            moodKey,
            isToday: dateKey === todayKey,
          };
        });

        return { month, days };
      }),
    [entries, year, todayKey]
  );

  return (
    <div className="year-grid">
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
            {days.map((day) => {
              const color = day.moodKey ? moodColorMap[day.moodKey] : "transparent";
              let cellClass = "year-grid__cell";
              if (day.isDisabled) cellClass += " year-grid__cell--disabled";
              else if (!day.moodKey) cellClass += " year-grid__cell--empty";
              if (day.isToday) cellClass += " year-grid__cell--today";

              return (
                <div
                  key={`${month}-${day.day}`}
                  className={cellClass}
                  title={
                    day.isDisabled
                      ? "N/A"
                      : day.moodKey
                      ? `${month} ${day.day}: ${day.moodKey}`
                      : `${month} ${day.day}: no entry`
                  }
                  style={{ background: day.moodKey ? color : undefined }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default YearMoodGrid;
