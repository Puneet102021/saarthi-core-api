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

  /* The person's one continuous chat, a page at a time; `before` pages further back. */
  chat: (before?: string) =>
    request<{ data: ChatPage }>("GET", `/api/chat${before ? `?before=${encodeURIComponent(before)}` : ""}`).then((r) => r.data),
  clearChat: () => request<{ success: true }>("DELETE", "/api/chat"),

  chart: () => request<{ data: ChartView }>("GET", "/api/chart").then((r) => r.data)
};
