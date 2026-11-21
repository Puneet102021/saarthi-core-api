import { useState } from "react";

import { api } from "../api";
import { useAuth } from "../auth";
import { ProfileForm } from "../components/ProfileForm";

function ClearHistory() {
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
      <h2>Your chat history</h2>
      <p className="muted small">
        Saarthi keeps your conversation so it can remember what you've shared. You can delete all of it; your chart and
        profile stay.
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

export default function ProfilePage() {
  const { me, refresh } = useAuth();

  return (
    <div className="page">
      <header className="page-head">
        <h1>Your profile</h1>
        <p className="muted">
          Signed in as {me?.email}. Changing your birth details rebuilds your chart; your answers about yourself shape how
          Saarthi talks with you.
        </p>
      </header>
      <ProfileForm
        mode="edit"
        initial={me?.profile}
        onSubmit={async (input) => {
          await api.saveOnboarding(input);
          await refresh();
        }}
      />
      <ClearHistory />
    </div>
  );
}
