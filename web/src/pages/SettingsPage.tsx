import { useEffect, useState } from "react";

import { api, FactCategory, MemoryFact, MemoryView } from "../api";
import { useAuth } from "../auth";
import { Icon } from "../components/Icon";

const CATEGORY: { id: FactCategory; label: string }[] = [
  { id: "people", label: "People in your life" },
  { id: "work", label: "Work and studies" },
  { id: "life", label: "Your situation" },
  { id: "event", label: "Events" },
  { id: "pattern", label: "Patterns" },
  { id: "helps", label: "What helps you" },
  { id: "goal", label: "Goals" },
  { id: "preference", label: "Preferences" }
];

const fmtDate = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

function MemorySection() {
  const [memory, setMemory] = useState<MemoryView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    api.memory().then(setMemory).catch((err) => setError(err.message));
  }, []);

  async function forget(fact: MemoryFact) {
    setBusy(fact.id);
    setError(null);
    try {
      await api.forgetFact(fact.id);
      setMemory((m) => (m ? { ...m, facts: m.facts.filter((f) => f.id !== fact.id) } : m));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function forgetAll() {
    if (!window.confirm("Make Saarthi forget everything it remembers about you? Your chat stays. This can't be undone.")) return;
    setBusy("all");
    setError(null);
    try {
      await api.forgetMemory();
      setMemory({ running: null, facts: [] });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const empty = memory && !memory.running && memory.facts.length === 0;

  return (
    <section className="card">
      <h2>What Saarthi remembers</h2>
      <p className="muted small">
        Like a friend, Saarthi remembers what you share so you don't have to repeat yourself: your latest messages word for
        word, a short summary of what you've been talking about lately, and lasting notes about your life. You can remove
        anything here.
      </p>

      {error && <p className="error">{error}</p>}
      {!memory && !error && <p className="muted small">Loading…</p>}
      {empty && (
        <p className="muted small memory-empty">
          Nothing yet. As you talk, Saarthi will keep notes about the people, events and things that matter to you.
        </p>
      )}

      {memory && memory.facts.length > 0 && (
        <div className="memory-groups">
          {CATEGORY.map(({ id, label }) => {
            const facts = memory.facts.filter((f) => f.category === id);
            if (!facts.length) return null;
            return (
              <div key={id} className="memory-group">
                <h3>{label}</h3>
                <ul className="memory-list">
                  {facts.map((f) => (
                    <li key={f.id}>
                      <span>
                        {f.text}
                        {f.eventDate && <span className="muted small"> · {fmtDate(f.eventDate)}</span>}
                      </span>
                      <button
                        className="icon-btn"
                        onClick={() => forget(f)}
                        disabled={busy !== null}
                        aria-label={`Forget: ${f.text}`}
                        title="Forget this"
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {memory?.running && (
        <div className="memory-group">
          <h3>What you've been talking about lately</h3>
          <p className="memory-running">{memory.running}</p>
        </div>
      )}

      {memory && !empty && (
        <button className="btn danger" onClick={forgetAll} disabled={busy !== null}>
          {busy === "all" ? "Forgetting…" : "Forget everything"}
        </button>
      )}
    </section>
  );
}

function ChatHistorySection() {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function clear() {
    if (!window.confirm("Delete your whole chat with Saarthi? This can't be undone.")) return;
    setState("busy");
    setError(null);
    try {
      await api.clearChat();
      setState("done");
    } catch (err) {
      setError((err as Error).message);
      setState("idle");
    }
  }

  return (
    <section className="card">
      <h2>Chat history</h2>
      <p className="muted small">
        Deletes every message and the summary of your recent conversation. Lasting notes stay unless you forget them above;
        your chart and profile stay too.
      </p>
      {error && <p className="error">{error}</p>}
      {state === "done" ? (
        <p className="saved">Your chat history is deleted.</p>
      ) : (
        <button className="btn danger" onClick={clear} disabled={state === "busy"}>
          {state === "busy" ? "Deleting…" : "Delete chat history"}
        </button>
      )}
    </section>
  );
}

export default function SettingsPage() {
  const { me, signOut } = useAuth();

  return (
    <div className="page">
      <header className="page-head">
        <h1>Settings</h1>
        <p className="muted">Your memory, your history and your account.</p>
      </header>

      <MemorySection />
      <ChatHistorySection />

      <section className="card">
        <h2>Account</h2>
        <p className="muted small">Signed in as {me?.email}.</p>
        <button className="btn" onClick={signOut}>
          <Icon name="out" size={16} /> Sign out
        </button>
      </section>
    </div>
  );
}
