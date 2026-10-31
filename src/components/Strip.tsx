/** Decorative preview of what a result looks like. Sample data, not a real show. */
export function Strip() {
  const ticks = Array.from({ length: 148 }, (_, i) => {
    const filler = [31, 32, 90, 91, 120].includes(i);
    const color = i === 56 ? 'var(--kaki)' : filler ? '#e0a21b' : i < 57 ? 'var(--asagi)' : 'rgba(34,29,46,0.2)';
    return { color, h: i === 56 ? 60 : 22 + ((i * 37) % 5) * 7 };
  });

  return (
    <section className="strip-section" aria-label="Example of a result">
      <div className="strip-legend">
        <span style={{ fontWeight: 700, color: 'var(--sumi)' }}>A show, every episode in order</span>
        <span>
          <b style={{ color: 'var(--asagi)' }}>Watched</b> · <b style={{ color: 'var(--kaki)' }}>You are here</b> · <b style={{ color: '#8a6200' }}>Recap</b>
        </span>
      </div>
      <div className="strip" aria-hidden="true">
        {ticks.map((t, i) => (
          <i key={i} style={{ height: t.h, background: t.color }} />
        ))}
      </div>
      <div className="strip-axis" aria-hidden="true">
        <span className="note">ここだ！ Episode 57</span>
      </div>
    </section>
  );
}
