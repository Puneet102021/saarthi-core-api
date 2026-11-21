import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";

import { api, ApiError } from "../api";
import { useAuth } from "../auth";
import { Brand } from "../components/Brand";

export default function AuthPage({ mode }: { mode: "signin" | "signup" }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const signup = mode === "signup";

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Enter a valid email address.");
    if (signup && password.length < 8) return setError("Use at least 8 characters for your password.");
    if (!password) return setError("Enter your password.");

    /* The API matches emails exactly, so always send them in one form. */
    const address = email.trim().toLowerCase();

    setBusy(true);
    try {
      const result = signup ? await api.signup(address, password) : await api.login(address, password);
      await signIn(result.token);
    } catch (err) {
      const status = (err as ApiError).status;
      setError(
        status === 409
          ? "An account with this email already exists. Sign in instead."
          : status === 401
            ? "That email and password don't match."
            : (err as Error).message
      );
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <section className="auth-intro">
        <Brand />
        <h1 className="voice">Talk it through. See the season you're in. Find your next step.</h1>
        <p className="muted">
          Saarthi reads your birth chart and listens like a friend. It helps you understand what you're going through,
          gives grounded guidance, and suggests simple practices. No fear, no gemstones, no nonsense.
        </p>
        <ul className="auth-points">
          <li>Share what's on your mind, big or small</li>
          <li>See which period of your chart you're in, and when it shifts</li>
          <li>Daily check-ins, or just when you need them</li>
        </ul>
      </section>

      <section className="auth-card">
        <form onSubmit={submit} noValidate>
          <h2>{signup ? "Create your account" : "Welcome back"}</h2>

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              placeholder="name@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              autoComplete={signup ? "new-password" : "current-password"}
              placeholder={signup ? "At least 8 characters" : "Your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          <button className="btn primary wide" disabled={busy}>
            {busy ? "One moment…" : signup ? "Create account" : "Sign in"}
          </button>

          <p className="muted small center">
            {signup ? (
              <>
                Already have an account? <Link to="/signin">Sign in</Link>
              </>
            ) : (
              <>
                New to Saarthi? <Link to="/signup">Create an account</Link>
              </>
            )}
          </p>
        </form>
      </section>
    </div>
  );
}
