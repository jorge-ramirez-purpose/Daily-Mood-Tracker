const SelectorButtons = ({ moods, selectedMood, onSelect }) => (
  <div className="selector__options">
    {moods.map((mood) => {
      const isActive = selectedMood === mood.key;
      return (
        <button
          key={mood.key}
          type="button"
          className={`selector__button${isActive ? " selector__button--active" : ""}`}
          style={{ "--mood-color": mood.color }}
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

export const DailyMoodSelector = ({
  moods,
  primaryMood,
  secondaryMood,
  isDual,
  onSelectPrimary,
  onSelectSecondary,
  onToggleDual,
  todayLabel,
}) => {
  return (
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
};
