export const DailyMoodSelector = ({ moods, selectedMood, onSelect, todayLabel }) => {
  return (
    <section className="selector">
      <p className="selector__eyebrow">{todayLabel}</p>
      <h1 className="selector__title">How's your mood today?</h1>

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

      <p className="selector__caption">Tap a color to capture today's vibe. We'll handle the rest.</p>
    </section>
  );
};

export default DailyMoodSelector;
