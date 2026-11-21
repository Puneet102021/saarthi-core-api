import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api, ChartView, DashaPeriod } from "../api";

const fmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", year: "numeric" });

const DIGNITY: Record<string, string> = {
  exalted: "Exalted",
  moolatrikona: "Moolatrikona",
  own: "Own sign",
  great_friend: "Great friend",
  friend: "Friendly",
  neutral: "Neutral",
  enemy: "Enemy sign",
  great_enemy: "Great enemy",
  debilitated: "Debilitated"
};

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function PeriodRow({ label, period, now }: { label: string; period: DashaPeriod; now: number }) {
  const start = Date.parse(period.start);
  const end = Date.parse(period.end);
  const pct = Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
  return (
    <div className="period-row">
      <div className="period-row-top">
        <span>
          <strong>{period.lord}</strong> <span className="muted small">{label}</span>
        </span>
        <span className="muted small">
          {fmt(period.start)} to {fmt(period.end)}
        </span>
      </div>
      <div className="bar" aria-hidden="true">
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ChartPage() {
  const [data, setData] = useState<ChartView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.chart().then(setData).catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="page"><p className="error">{error}</p></div>;
  if (!data) return <div className="page"><p className="muted">Reading your chart…</p></div>;

  const { chart, now } = data;
  const sun = chart.planets.find((p) => p.planet === "Sun");
  const moon = chart.planets.find((p) => p.planet === "Moon");
  const time = Date.now();

  const yogas = chart.yogas
    .filter((y) => y.strength !== "cancelled")
    .sort((a, b) => ["strong", "moderate", "weak"].indexOf(a.strength) - ["strong", "moderate", "weak"].indexOf(b.strength));

  return (
    <div className="page">
      <header className="page-head">
        <h1>Your chart</h1>
        <p className="muted">
          Vedic (sidereal) positions, whole-sign houses.{" "}
          {!chart.birthTimeKnown && "Your birth time is unknown, so houses are counted from your Moon sign."}
        </p>
      </header>

      <div className="stats">
        <div className="stat">
          <span className="muted small">{chart.birthTimeKnown ? "Rising sign" : "Moon sign (used as 1st house)"}</span>
          <strong>{chart.birthTimeKnown ? chart.ascendant.sign : chart.moonSign}</strong>
        </div>
        <div className="stat">
          <span className="muted small">Moon sign</span>
          <strong>{chart.moonSign}</strong>
          <span className="muted small">{moon?.nakshatra} nakshatra</span>
        </div>
        <div className="stat">
          <span className="muted small">Sun sign</span>
          <strong>{sun?.sign}</strong>
        </div>
      </div>

      {now.period && (
        <section className="card">
          <h2>The period you're in</h2>
          <p className="muted small">
            Vimshottari dasha: each planet takes a turn shaping your life, in layers. The innermost changes every few weeks.
          </p>
          <PeriodRow label="major period" period={now.period.mahadasha} now={time} />
          <PeriodRow label="sub-period" period={now.period.antardasha} now={time} />
          <PeriodRow label="current phase" period={now.period.pratyantardasha} now={time} />
          <Link className="btn small" to="/" state={{ draft: "What does the period I'm in mean for me right now?" }}>
            Ask Saarthi about this period
          </Link>
        </section>
      )}

      <section className="card">
        <h2>Planets</h2>
        <div className="table-wrap">
          <table className="planets">
            <thead>
              <tr>
                <th>Planet</th>
                <th>Sign</th>
                <th>House</th>
                <th>Nakshatra</th>
                <th>Condition</th>
                <th>Strength</th>
              </tr>
            </thead>
            <tbody>
              {chart.planets.map((p) => (
                <tr key={p.planet}>
                  <td>
                    <strong>{p.planet}</strong>
                    {p.retrograde && p.planet !== "Rahu" && p.planet !== "Ketu" && <span className="tag">R</span>}
                  </td>
                  <td>{p.sign}</td>
                  <td>{ordinal(p.house)}</td>
                  <td>{p.nakshatra}</td>
                  <td className="muted">
                    {p.dignity ? DIGNITY[p.dignity] ?? p.dignity : "—"}
                    {p.combust ? ", combust" : ""}
                  </td>
                  <td>
                    <span className="meter" title={`${p.strength.score}/100`}>
                      <span style={{ width: `${p.strength.score}%` }} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="two-col">
        <section className="card">
          <h2>Yogas and doshas</h2>
          {yogas.length === 0 && <p className="muted small">No notable combinations.</p>}
          <ul className="plain">
            {yogas.map((y) => (
              <li key={y.id}>
                <span>{y.name}</span>
                <span className={`pill ${y.kind}`}>
                  {y.strength} {y.kind}
                  {y.modern ? ", popular" : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2>Slow planets now</h2>
          <p className="muted small">Where they are today, counted from your Moon.</p>
          <ul className="plain">
            {now.transits.map((t) => (
              <li key={t.planet}>
                <span>
                  {t.planet} in {t.sign}
                  {t.retrograde && t.planet !== "Rahu" && t.planet !== "Ketu" ? " (R)" : ""}
                </span>
                <span className={`pill ${t.favourable ? "good" : "hard"}`}>
                  {ordinal(t.houseFromMoon)} from Moon
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
