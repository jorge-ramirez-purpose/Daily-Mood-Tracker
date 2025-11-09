import type { CSSProperties } from "react";
import { MOODS } from "../constants/moods";

export const MoodLegend = () => {
  return (
    <div className="legend">
      {MOODS.map((mood) => {
        const style: CSSProperties = { background: mood.color };
        return (
          <div key={mood.key} className="legend__item">
            <span className="legend__swatch" style={style} />
            <span>{mood.key}</span>
          </div>
        );
      })}
    </div>
  );
};
