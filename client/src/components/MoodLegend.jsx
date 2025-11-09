import { MOODS } from "../constants/moods.js";

export const MoodLegend = () => {
  return (
    <div className="legend">
      {MOODS.map((mood) => (
        <div key={mood.key} className="legend__item">
          <span className="legend__swatch" style={{ background: mood.color }} />
          <span>{mood.key}</span>
        </div>
      ))}
    </div>
  );
};

export default MoodLegend;
