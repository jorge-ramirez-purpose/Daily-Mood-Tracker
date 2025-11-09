import { Fragment, useMemo } from "react";
import { MOODS } from "../constants/moods.js";

const formatValue = (value) => {
  if (Number.isInteger(value)) return value;
  return Number(value ?? 0)
    .toFixed(1)
    .replace(/\.0$/, "");
};

export const MoodGrid = ({ data }) => {
  const maxPerMonth = useMemo(() => data.map((row) => Math.max(...MOODS.map((mood) => row[mood.key]))), [data]);

  return (
    <div className="grid-wrapper">
      <div className="grid" style={{ gridTemplateColumns: `84px repeat(${MOODS.length}, minmax(68px, 1fr))` }}>
        <div className="grid__spacer" />
        {MOODS.map((mood) => (
          <div key={mood.key} className="grid__header">
            {mood.key}
          </div>
        ))}
        {data.map((row, rowIndex) => (
          <Fragment key={row.month}>
            <div className="grid__month">{row.month}</div>
            {MOODS.map((mood) => {
              const value = row[mood.key];
              const max = maxPerMonth[rowIndex] || 1;
              const opacity = max === 0 ? 0 : Math.max(0.15, value / max);

              return (
                <div
                  key={`${row.month}-${mood.key}`}
                  className="grid__cell"
                  style={{ background: mood.color, opacity }}
                  title={`${row.month} – ${mood.key}: ${value} day${value === 1 ? "" : "s"}`}
                >
                  <span className="grid__value">{formatValue(value)}</span>
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
};
