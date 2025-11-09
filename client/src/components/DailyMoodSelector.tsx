import type { CSSProperties } from "react";
import type { MoodConfig, MoodKey } from "../constants/moods";

type SelectorButtonsProps = {
  moods: readonly MoodConfig[];
  selectedMood: MoodKey | null;
  onSelect: (mood: MoodKey) => void;
};

const SelectorButtons = ({ moods, selectedMood, onSelect }: SelectorButtonsProps) => (
  <div className="selector__options">
    {moods.map((mood) => {
      const isActive = selectedMood === mood.key;
      const style: CSSProperties & { "--mood-color"?: string } = { "--mood-color": mood.color };
      return (
        <button
          key={mood.key}
          type="button"
          className={`selector__button${isActive ? " selector__button--active" : ""}`}
          style={style}
          onClick={() => onSelect(mood.key)}
          aria-pressed={isActive}
        >
          <span className="selector__swatch" />
          <span className="selector__label">{mood.key}</span>
        </button>
      );
    })}
  </div>
);

type DailyMoodSelectorProps = {
  moods: readonly MoodConfig[];
  primaryMood: MoodKey | null;
  secondaryMood: MoodKey | null;
  isDual: boolean;
  onSelectPrimary: (mood: MoodKey) => void;
  onSelectSecondary: (mood: MoodKey) => void;
  onToggleDual: (checked: boolean) => void;
  todayLabel: string;
};

export const DailyMoodSelector = ({
  moods,
  primaryMood,
  secondaryMood,
  isDual,
  onSelectPrimary,
  onSelectSecondary,
  onToggleDual,
  todayLabel,
}: DailyMoodSelectorProps) => (
  <section className="selector">
    <p className="selector__eyebrow">{todayLabel}</p>
    <h1 className="selector__title">How&apos;s your mood today?</h1>

    <div className="selector__group">
      <p className="selector__group-label">First half of the day</p>
      <SelectorButtons moods={moods} selectedMood={primaryMood} onSelect={onSelectPrimary} />
    </div>

    <label className="selector__dual">
      <input
        type="checkbox"
        checked={isDual}
        onChange={(event) => onToggleDual(event.target.checked)}
        disabled={!primaryMood}
      />
      <span>Split this day between two moods</span>
    </label>

    {isDual && (
      <div className="selector__group">
        <p className="selector__group-label">Second half of the day</p>
        <SelectorButtons moods={moods} selectedMood={secondaryMood} onSelect={onSelectSecondary} />
      </div>
    )}

    <p className="selector__caption">Tap a color to capture today&apos;s vibe. We&apos;ll handle the rest.</p>
  </section>
);
