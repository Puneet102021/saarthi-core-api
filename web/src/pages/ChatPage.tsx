import { FormEvent, KeyboardEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { api, Evidence, Remedy, StoredMessage } from "../api";
import { useAuth } from "../auth";
import { AssistantMessage } from "../components/AssistantMessage";
import { Mark } from "../components/Brand";
import { Icon } from "../components/Icon";

interface Turn {
  key: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  evidence?: Evidence[];
  remedies?: Remedy[];
  followUps?: string[];
}

const STARTERS = [
  "How's today looking for me?",
  "I've been feeling stuck lately",
  "Is this a good time to change jobs?",
  "What should I focus on this week?"
];

function greeting(name?: string | null) {
  const h = new Date().getHours();
  const part = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return name ? `${part}, ${name.split(" ")[0]}` : part;
}

function toTurn(m: StoredMessage): Turn {
  return {
    key: m.id,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt,
    evidence: m.meta?.evidence,
    remedies: m.meta?.remedies,
    followUps: m.meta?.followUps
  };
}

const dayKey = (iso: string) => new Date(iso).toDateString();

/* "Today", "Yesterday", "Monday", or "12 Nov" / "12 Nov 2025". */
function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const days = Math.round((new Date(today.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString(undefined, { weekday: "long" });
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(d.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {})
  });
}

const time = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

export default function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { me } = useAuth();

  const [turns, setTurns] = useState<Turn[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  /* Where to put the scroll position after the next render. */
  const pendingScroll = useRef<{ mode: "bottom" } | { mode: "keep"; height: number; top: number } | null>(null);

  useEffect(() => {
    api
      .chart()
      .then((c) => setPeriod(c.now.period?.label ?? null))
      .catch(() => {});
  }, []);

  /* The latest page of the chat, opened at the bottom like any messaging app. */
  useEffect(() => {
    api
      .chat()
      .then((page) => {
        pendingScroll.current = { mode: "bottom" };
        setTurns(page.messages.map(toTurn));
        setHasMore(page.hasMore);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoaded(true));
  }, []);

  /* Prefill a message passed from onboarding or the chart page. */
  useEffect(() => {
    const draft = (location.state as { draft?: string } | null)?.draft;
    if (draft) {
      setInput(draft);
      navigate(location.pathname, { replace: true, state: null });
      inputRef.current?.focus();
    }
  }, [location, navigate]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    const pending = pendingScroll.current;
    if (!el || !pending) return;
    if (pending.mode === "bottom") el.scrollTop = el.scrollHeight;
    else el.scrollTop = pending.top + (el.scrollHeight - pending.height);
    pendingScroll.current = null;
  }, [turns, sending]);

  const loadOlder = useCallback(async () => {
    const el = scrollRef.current;
    if (!el || loadingOlder || !hasMore || turns.length === 0) return;

    setLoadingOlder(true);
    try {
      const page = await api.chat(turns[0].createdAt);
      pendingScroll.current = { mode: "keep", height: el.scrollHeight, top: el.scrollTop };
      setTurns((t) => [...page.messages.map(toTurn), ...t]);
      setHasMore(page.hasMore);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingOlder(false);
    }
  }, [hasMore, loadingOlder, turns]);

  function onScroll() {
    if (scrollRef.current && scrollRef.current.scrollTop < 120) loadOlder();
  }

  async function send(text: string) {
    const message = text.trim();
    if (!message || sending) return;
    if (message.length > 2000) {
      setError("That's a long message. Keep it under 2,000 characters.");
      return;
    }

    setError(null);
    setInput("");
    setSending(true);
    pendingScroll.current = { mode: "bottom" };
    setTurns((t) => [...t, { key: `u${Date.now()}`, role: "user", content: message, createdAt: new Date().toISOString() }]);

    try {
      const result = await api.ask(message);
      pendingScroll.current = { mode: "bottom" };
      setTurns((t) => [
        ...t,
        {
          key: `a${Date.now()}`,
          role: "assistant",
          content: result.answer,
          createdAt: new Date().toISOString(),
          evidence: result.evidence,
          remedies: result.remedies,
          followUps: result.followUps
        }
      ]);
      if (result.currentPeriod) setPeriod(result.currentPeriod);
    } catch (err) {
      setError((err as Error).message);
      /* Put the message back so nothing they typed is lost. */
      setTurns((t) => t.slice(0, -1));
      setInput(message);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(input);
    }
  }

  const last = turns[turns.length - 1];
  const followUps = !sending && last?.role === "assistant" ? last.followUps ?? [] : [];

  return (
    <div className="chat">
      {period && (
        <div className="chat-head">
          <span className="period" title="The planetary period you're in now">
            {period.replace(/ (Mahadasha|Antardasha|Pratyantardasha)/g, "")} period
          </span>
        </div>
      )}

      <div className="chat-scroll" ref={scrollRef} onScroll={onScroll}>
        <div className="chat-inner">
          {hasMore && (
            <div className="older">
              <button className="btn ghost small" onClick={loadOlder} disabled={loadingOlder}>
                {loadingOlder ? "Loading…" : "Show earlier messages"}
              </button>
            </div>
          )}

          {loaded && turns.length === 0 && (
            <div className="empty">
              <Mark size={40} />
              <h1 className="voice">{greeting(me?.profile?.fullName)}</h1>
              <p className="muted">
                This is your space to talk with Saarthi, any time. Share what you're going through, ask about a decision,
                or check in on your day.
              </p>
              <div className="chips">
                {STARTERS.map((s) => (
                  <button key={s} className="chip" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loaded && <p className="muted center">Loading…</p>}

          {turns.map((t, i) => {
            const newDay = i === 0 || dayKey(turns[i - 1].createdAt) !== dayKey(t.createdAt);
            return (
              <div key={t.key}>
                {newDay && (
                  <div className="day" role="separator">
                    <span>{dayLabel(t.createdAt)}</span>
                  </div>
                )}
                {t.role === "user" ? (
                  <div className="msg user">
                    <div className="bubble" title={time(t.createdAt)}>
                      {t.content}
                    </div>
                  </div>
                ) : (
                  <AssistantMessage content={t.content} evidence={t.evidence} remedies={t.remedies} />
                )}
              </div>
            );
          })}

          {sending && (
            <div className="msg assistant thinking" aria-live="polite">
              <span className="dots">
                <i />
                <i />
                <i />
              </span>
              Saarthi is reflecting…
            </div>
          )}

          {followUps.length > 0 && (
            <div className="chips follow">
              {followUps.map((f) => (
                <button key={f} className="chip" onClick={() => send(f)}>
                  {f}
                </button>
              ))}
            </div>
          )}

          {error && (
            <p className="error center" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>

      <form className="composer" onSubmit={onSubmit}>
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          maxLength={2000}
          placeholder={turns.length ? "Message Saarthi" : "Tell Saarthi what's on your mind"}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          aria-label="Message"
        />
        <button className="send" disabled={sending || !input.trim()} aria-label="Send">
          <Icon name="send" size={18} />
        </button>
      </form>
      <p className="disclaimer">Saarthi offers reflection, not medical, legal or financial advice. In crisis, call Tele-MANAS on 14416.</p>
    </div>
  );
}
