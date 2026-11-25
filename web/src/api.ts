/* The one place that talks to the Saarthi API. Same origin in dev (Vite proxy) and production (nginx). */

const TOKEN_KEY = "saarthi.token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* Private mode: the session lasts until the tab closes. */
  }
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/* Called when the server rejects the token, so the app can sign out. */
let onUnauthorized: () => void = () => {};
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError("Couldn't reach Saarthi. Check your connection and try again.", 0);
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data?.success === false) {
    if (res.status === 401 && token) onUnauthorized();
    const message = data?.error || data?.message || "Something went wrong. Try again.";
    throw new ApiError(message, res.status);
  }

  return data as T;
}

/*
  POST /api/ask/stream reads server-sent events: the reply arrives piece by
  piece (onDelta), then the full result. Falls back to a thrown ApiError,
  like request(), when the server refuses before streaming starts.
*/
async function streamRequest(path: string, body: unknown, onDelta: (text: string) => void): Promise<AskResult> {
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "text/event-stream" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(path, { method: "POST", headers, body: JSON.stringify(body) });
  } catch {
    throw new ApiError("Couldn't reach Saarthi. Check your connection and try again.", 0);
  }

  if (!res.ok || !res.body || !(res.headers.get("Content-Type") ?? "").includes("text/event-stream")) {
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && token) onUnauthorized();
    throw new ApiError(data?.error || data?.message || "Something went wrong. Try again.", res.status);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: AskResult | null = null;

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let split: number;
    while ((split = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, split);
      buffer = buffer.slice(split + 2);

      const event = /^event: (.*)$/m.exec(raw)?.[1];
      const data = /^data: (.*)$/m.exec(raw)?.[1];
      if (!event || data === undefined) continue;

      const payload = JSON.parse(data);
      if (event === "delta") onDelta(payload.text);
      else if (event === "done") result = payload as AskResult;
      else if (event === "error") throw new ApiError(payload.error, 500);
    }
  }

  if (!result) throw new ApiError("The reply was cut off. Try again.", 0);
  return result;
}

/* ---- Types (only the fields the app uses) ---- */

export interface AuthResult {
  token: string;
  user: { id: string; email: string; onboardingCompleted: boolean };
}

export interface Location {
  id: number;
  name: string;
  state: string;
}

export interface Profile {
  fullName: string | null;
  birthDate: string | null;
  birthTime: string | null;
  birthTimeKnown: boolean;
  birthPlace: string | null;
  locationId: number | null;
  primaryFocus: string | null;
  secondaryFocus: string | null;
  pressureResponse: string | null;
  misunderstoodFor: string | null;
  entryReason: string | null;
  entryQuestion: string | null;
  location: Location | null;
}

export interface Me {
  email: string;
  onboardingCompleted: boolean;
  profile: Profile | null;
}

export interface OnboardingInput {
  fullName: string;
  birthDate: string;
  birthTime: string | null;
  birthTimeKnown: boolean;
  locationId: number;
  primaryFocus: string;
  secondaryFocus: string;
  pressureResponse: string;
  misunderstoodFor: string;
  entryReason: string;
  entryQuestion: string;
}

export interface Evidence {
  id: string;
  title: string;
  statement: string;
  polarity: "supportive" | "challenging" | "mixed" | "neutral";
  timeframe?: { start: string; end: string };
}

export interface Remedy {
  id: string;
  ref: string;
  planet: string | null;
  kind: "practical" | "psychological" | "traditional";
  title: string;
  practice: string;
  why: string;
  strengthen?: string;
  framing: "ease" | "strengthen";
}

export type Need = "support" | "guidance" | "support_guidance" | "daily" | "optimise";

export interface AskResult {
  answer: string;
  need: Need;
  firstReading: boolean;
  evidenceUsed: string[];
  evidence: Evidence[];
  remedies: Remedy[];
  followUps: string[];
  currentPeriod: string | null;
}

export interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  meta: {
    need?: Need;
    evidence?: Evidence[];
    remedies?: Remedy[];
    followUps?: string[];
  } | null;
}

export interface ChatPage {
  messages: StoredMessage[];
  hasMore: boolean;
}

export type FactCategory = "people" | "work" | "life" | "experience" | "event" | "pattern" | "helps" | "goal" | "preference";

export interface MemoryFact {
  id: string;
  category: FactCategory;
  text: string;
  eventDate: string | null;
  importance: 1 | 2 | 3;
  updatedAt: string | null;
}

export interface MemoryView {
  running: string | null;
  facts: MemoryFact[];
}

export interface DashaPeriod {
  lord: string;
  start: string;
  end: string;
}

export interface Planet {
  planet: string;
  sign: string;
  house: number;
  nakshatra: string;
  dignity: string | null;
  retrograde: boolean;
  combust: boolean;
  strength: { score: number; label: string };
}

export interface Yoga {
  id: string;
  name: string;
  kind: "yoga" | "dosha";
  strength: "strong" | "moderate" | "weak" | "cancelled";
  modern?: boolean;
}

export interface Transit {
  planet: string;
  sign: string;
  retrograde: boolean;
  houseFromMoon: number;
  favourable: boolean;
}

export interface ChartView {
  chart: {
    birthTimeKnown: boolean;
    ascendant: { sign: string };
    moonSign: string;
    planets: Planet[];
    yogas: Yoga[];
    dasha: { birthNakshatra: string };
  };
  now: {
    period: { label: string; mahadasha: DashaPeriod; antardasha: DashaPeriod; pratyantardasha: DashaPeriod } | null;
    transits: Transit[];
  };
}

/* ---- Calls ---- */

export const api = {
  signup: (email: string, password: string) => request<AuthResult>("POST", "/auth/signup", { email, password }),
  login: (email: string, password: string) => request<AuthResult>("POST", "/auth/login", { email, password }),

  me: () => request<{ data: Me }>("GET", "/api/onboarding").then((r) => r.data),
  saveOnboarding: (input: OnboardingInput) => request<{ success: true }>("POST", "/api/onboarding", input),

  searchLocations: (q: string) => request<Location[]>("GET", `/api/locations/search?q=${encodeURIComponent(q)}`),

  ask: (message: string) => request<{ data: AskResult }>("POST", "/api/ask", { message }).then((r) => r.data),
  /* The same, with the reply arriving as it is written. */
  askStream: (message: string, onDelta: (text: string) => void) => streamRequest("/api/ask/stream", { message }, onDelta),

  /* The person's one continuous chat, a page at a time; `before` pages further back. */
  chat: (before?: string) =>
    request<{ data: ChatPage }>("GET", `/api/chat${before ? `?before=${encodeURIComponent(before)}` : ""}`).then((r) => r.data),
  clearChat: () => request<{ success: true }>("DELETE", "/api/chat"),

  memory: () => request<{ data: MemoryView }>("GET", "/api/memory").then((r) => r.data),
  forgetFact: (id: string) => request<{ success: true }>("DELETE", `/api/memory/facts/${encodeURIComponent(id)}`),
  forgetMemory: () => request<{ success: true }>("DELETE", "/api/memory"),

  chart: () => request<{ data: ChartView }>("GET", "/api/chart").then((r) => r.data)
};
