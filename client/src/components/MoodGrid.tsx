import { Fragment, useMemo } from "react";
import { MOODS } from "../constants/moods";
import type { AggregatedRow } from "../utils/data";

const formatValue = (value: number) => {
  if (Number.isInteger(value)) return value.toString();
  return value.toFixed(1).replace(/\.0$/, "");
};

const hexToRgb = (hex: string) => {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
};

const mixWithWhite = (hex: string, ratio: number) => {
  const { r, g, b } = hexToRgb(hex);
  const mix = (channel: number) => Math.round(channel + (255 - channel) * (1 - ratio));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
};

type MoodGridProps = {
  data: AggregatedRow[];
};

export const MoodGrid = ({ data }: MoodGridProps) => {
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
              const ratio = max === 0 ? 0 : value / max;
              const background =
                ratio === 0 ? "rgba(148,163,184,0.15)" : mixWithWhite(mood.color, Math.max(ratio, 0.2));

              return (
                <div
                  key={`${row.month}-${mood.key}`}
                  className="grid__cell"
                  style={{ background }}
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
