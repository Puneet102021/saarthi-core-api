import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";

import { api, Evidence, Remedy } from "../api";
import { useAuth } from "../auth";
import { AssistantMessage } from "../components/AssistantMessage";
import type { ShellContext } from "../components/AppShell";
import { Mark } from "../components/Brand";
import { Icon } from "../components/Icon";

interface Turn {
  key: string;
  role: "user" | "assistant";
  content: string;
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

export default function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { me } = useAuth();
  const { refreshConversations } = useOutletContext<ShellContext>();

  const [turns, setTurns] = useState<Turn[]>([]);
  const [title, setTitle] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  /* A conversation this page just created is already on screen; don't reload it. */
  const justCreated = useRef<string | null>(null);

  useEffect(() => {
    api
      .chart()
      .then((c) => setPeriod(c.now.period?.label ?? null))
      .catch(() => {});
  }, []);

  /* Prefill the first message from onboarding ("what's on your mind"). */
  useEffect(() => {
    const draft = (location.state as { draft?: string } | null)?.draft;
    if (draft) {
      setInput(draft);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  useEffect(() => {
    setError(null);

    if (!id) {
      setTurns([]);
      setTitle(null);
      inputRef.current?.focus();
      return;
    }

    if (justCreated.current === id) {
      justCreated.current = null;
      return;
    }

    let cancelled = false;
    setLoading(true);
    api
      .conversation(id)
      .then((c) => {
        if (cancelled) return;
        setTitle(c.title);
        setTurns(
          c.messages.map((m) => ({
            key: m.id,
            role: m.role,
            content: m.content,
            evidence: m.meta?.evidence,
            remedies: m.meta?.remedies,
            followUps: m.meta?.followUps
          }))
        );
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, sending]);

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
    setTurns((t) => [...t, { key: `u${Date.now()}`, role: "user", content: message }]);

    try {
      const result = await api.ask(message, id);
      setTurns((t) => [
        ...t,
        {
          key: `a${Date.now()}`,
          role: "assistant",
          content: result.answer,
          evidence: result.evidence,
          remedies: result.remedies,
          followUps: result.followUps
        }
      ]);
      if (result.currentPeriod) setPeriod(result.currentPeriod);

      if (!id) {
        justCreated.current = result.conversationId;
        setTitle(message.length > 60 ? `${message.slice(0, 59)}…` : message);
        navigate(`/c/${result.conversationId}`, { replace: true });
      }
      refreshConversations();
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
      <header className="chat-head">
        <span className="chat-title">{title ?? "New conversation"}</span>
        {period && (
          <span className="period" title="The planetary period you're in now">
            {period.replace(/ (Mahadasha|Antardasha|Pratyantardasha)/g, "")} period
          </span>
        )}
      </header>

      <div className="chat-scroll">
        <div className="chat-inner">
          {!id && turns.length === 0 && (
            <div className="empty">
              <Mark size={40} />
              <h1 className="voice">{greeting(me?.profile?.fullName)}</h1>
              <p className="muted">What's on your mind? Share something you're going through, ask about a decision, or check in on your day.</p>
              <div className="chips">
                {STARTERS.map((s) => (
                  <button key={s} className="chip" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && <p className="muted center">Loading conversation…</p>}

          {turns.map((t) =>
            t.role === "user" ? (
              <div key={t.key} className="msg user">
                <div className="bubble">{t.content}</div>
              </div>
            ) : (
              <AssistantMessage key={t.key} content={t.content} evidence={t.evidence} remedies={t.remedies} />
            )
          )}

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
          <div ref={endRef} />
        </div>
      </div>

      <form className="composer" onSubmit={onSubmit}>
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          maxLength={2000}
          placeholder="Tell Saarthi what's on your mind"
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
