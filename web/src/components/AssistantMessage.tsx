import { useState } from "react";
import ReactMarkdown from "react-markdown";

import type { Evidence, Remedy } from "../api";
import { Icon } from "./Icon";

/*
  Saarthi cites chart evidence as [E4] and remedies as [R1]. In the text they
  become small numbered marks that open the "why" list or point at a card.
  Markdown has no citation syntax, so they travel through as inline code.
*/
const CITATION = /\[((?:[ER]\d+)(?:\s*,\s*[ER]\d+)*)\]/g;

function withCitationMarkers(text: string): string {
  return text.replace(CITATION, (_, group: string) =>
    group
      .split(/\s*,\s*/)
      .map((id) => `\`@cite:${id}\``)
      .join("")
  );
}

const PLANET_ICON: Record<string, string> = { Moon: "moon", Sun: "sun", Mars: "flame" };
const KIND_LABEL: Record<Remedy["kind"], string> = {
  practical: "Practical",
  psychological: "Mind",
  traditional: "Traditional, optional"
};

function RemedyCard({ remedy, index }: { remedy: Remedy; index: number }) {
  const practice = remedy.framing === "strengthen" && remedy.strengthen ? remedy.strengthen : remedy.practice;
  return (
    <div className="remedy" id={`tip-${remedy.ref}`}>
      <p className="remedy-kind">
        <Icon name={remedy.planet ? PLANET_ICON[remedy.planet] ?? "compass" : remedy.kind === "psychological" ? "brain" : "leaf"} size={14} />
        {remedy.planet ? `${remedy.planet} · ` : ""}
        {KIND_LABEL[remedy.kind]}
        <span className="remedy-num">tip {index + 1}</span>
      </p>
      <p className="remedy-title">{remedy.title}</p>
      <p className="remedy-text">{practice}</p>
      <p className="remedy-why">{remedy.why}</p>
    </div>
  );
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

export function AssistantMessage({
  content,
  evidence = [],
  remedies = []
}: {
  content: string;
  evidence?: Evidence[];
  remedies?: Remedy[];
}) {
  const [showWhy, setShowWhy] = useState(false);
  const [highlight, setHighlight] = useState<string | null>(null);

  /* Number chart factors in the order the reply mentions them; uncited ones go last. */
  const mentioned = [...content.matchAll(/E\d+/g)].map((m) => m[0]);
  const rank = (id: string) => {
    const i = mentioned.indexOf(id);
    return i === -1 ? Infinity : i;
  };
  evidence = [...evidence].sort((a, b) => rank(a.id) - rank(b.id));
  const evidenceIndex = new Map(evidence.map((e, i) => [e.id, i + 1]));
  const remedyIndex = new Map(remedies.map((r, i) => [r.ref, i + 1]));

  function openEvidence(id: string) {
    setShowWhy(true);
    setHighlight(id);
  }

  return (
    <div className="msg assistant">
      <div className="voice answer">
        <ReactMarkdown
          components={{
            code({ children }) {
              const text = String(children);
              if (!text.startsWith("@cite:")) return <code>{children}</code>;

              const id = text.slice(6);
              if (id.startsWith("E")) {
                const n = evidenceIndex.get(id);
                if (!n) return null;
                return (
                  <button className="cite" onClick={() => openEvidence(id)} aria-label={`Chart factor ${n}`}>
                    {n}
                  </button>
                );
              }

              const n = remedyIndex.get(id);
              if (!n) return null;
              return (
                <a className="cite tip" href={`#tip-${id}`} aria-label={`Tip ${n}`}>
                  tip {n}
                </a>
              );
            }
          }}
        >
          {withCitationMarkers(content)}
        </ReactMarkdown>
      </div>

      {remedies.length > 0 && (
        <div className="remedies">
          {remedies.map((r, i) => (
            <RemedyCard key={r.ref} remedy={r} index={i} />
          ))}
        </div>
      )}

      {evidence.length > 0 && (
        <div className="why">
          <button className="why-toggle" onClick={() => setShowWhy((v) => !v)} aria-expanded={showWhy}>
            <Icon name="chevron" size={14} className={showWhy ? "rot" : ""} />
            Why Saarthi said this ({evidence.length} chart {evidence.length === 1 ? "factor" : "factors"})
          </button>
          {showWhy && (
            <ol className="why-list">
              {evidence.map((e) => (
                <li key={e.id} className={`${e.polarity} ${highlight === e.id ? "hl" : ""}`}>
                  <p className="why-title">
                    {e.title}
                    <span className={`pol ${e.polarity}`}>{e.polarity}</span>
                  </p>
                  <p className="why-text">{e.statement}</p>
                  {e.timeframe && e.timeframe.start !== e.timeframe.end && (
                    <p className="muted small">
                      {fmt(e.timeframe.start)} to {fmt(e.timeframe.end)}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
