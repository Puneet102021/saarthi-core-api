import { useState } from "react";
import ReactMarkdown from "react-markdown";

import type { Evidence, Remedy } from "../api";
import { Icon } from "./Icon";

/*
  Saarthi talks like a friend, so the chart stays out of the way: the [E4]
  and [R1] citations the model writes are dropped from the text, and the
  astrology behind a reply sits in a quiet, collapsed note underneath.
*/
const CITATION = /\s*\[((?:[ER]\d+)(?:\s*,\s*[ER]\d+)*)\]/g;

/* While a reply streams in, a citation can arrive half written ("[E", "[E1, E"); hide those too. */
const PARTIAL_CITATION = /\s*\[(?:[ER]\d*(?:\s*,\s*)?)*$/;

const withoutCitations = (text: string) => text.replace(CITATION, "").replace(PARTIAL_CITATION, "");

const KIND_LABEL: Record<Remedy["kind"], string> = {
  practical: "Something to try",
  psychological: "For your mind",
  traditional: "A traditional practice, if it suits you"
};

const KIND_ICON: Record<Remedy["kind"], string> = {
  practical: "leaf",
  psychological: "brain",
  traditional: "compass"
};

function RemedyCard({ remedy }: { remedy: Remedy }) {
  const practice = remedy.framing === "strengthen" && remedy.strengthen ? remedy.strengthen : remedy.practice;
  return (
    <div className="remedy">
      <p className="remedy-kind">
        <Icon name={KIND_ICON[remedy.kind]} size={14} />
        {KIND_LABEL[remedy.kind]}
      </p>
      <p className="remedy-title">{remedy.title}</p>
      <p className="remedy-text">{practice}</p>
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

  /* List the chart factors in the order the reply drew on them; uncited ones go last. */
  const mentioned = [...content.matchAll(/E\d+/g)].map((m) => m[0]);
  const rank = (id: string) => {
    const i = mentioned.indexOf(id);
    return i === -1 ? Infinity : i;
  };
  const factors = [...evidence].sort((a, b) => rank(a.id) - rank(b.id));

  return (
    <div className="msg assistant">
      <div className="answer">
        <ReactMarkdown>{withoutCitations(content)}</ReactMarkdown>
      </div>

      {remedies.length > 0 && (
        <div className="remedies">
          {remedies.map((r) => (
            <RemedyCard key={r.ref} remedy={r} />
          ))}
        </div>
      )}

      {factors.length > 0 && (
        <div className="why">
          <button className="why-toggle" onClick={() => setShowWhy((v) => !v)} aria-expanded={showWhy}>
            <Icon name="chevron" size={13} className={showWhy ? "rot" : ""} />
            The astrology behind this
          </button>
          {showWhy && (
            <ul className="why-list">
              {factors.map((e) => (
                <li key={e.id}>
                  <p className="why-title">{e.title}</p>
                  <p className="why-text">{e.statement}</p>
                  {e.timeframe && e.timeframe.start !== e.timeframe.end && (
                    <p className="muted small">
                      {fmt(e.timeframe.start)} to {fmt(e.timeframe.end)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
