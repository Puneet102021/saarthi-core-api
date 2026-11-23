import { ChatMessage, jsonCompletion, llmAvailable, models } from "../lib/llm";
import { DOMAINS, DOMAIN_IDS, DomainId } from "./domains";

export const QUESTION_TYPES = ["timing", "yes_no", "guidance", "explanation", "general"] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export const SENSITIVITIES = ["none", "distress", "medical", "legal", "financial", "longevity", "self_harm"] as const;

export type Sensitivity = (typeof SENSITIVITIES)[number];

/*
  What the person needs from this message. Never chosen by the user: it is
  inferred every turn, so one conversation can move from venting to planning.
*/
export const NEEDS = ["support", "guidance", "support_guidance", "daily", "optimise"] as const;

export type Need = (typeof NEEDS)[number];

export interface QuestionIntent {
  domains: DomainId[];
  questionType: QuestionType;
  /* The period the question is about, if any; dates are YYYY-MM-DD. */
  window: { start: string; end: string } | null;
  sensitive: Sensitivity;
  need: Need;
  /* They ask what to do about it: remedies, upay, solutions. */
  wantsRemedies: boolean;
  /* The message opens a new problem or question rather than continuing the recent one. */
  newTopic: boolean;
  /* They ask about the astrology itself (their chart, periods, planets, transits): answer in depth. */
  wantsAstrology: boolean;
  source: "llm" | "keywords";
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_WINDOW_DAYS = 5 * 366;

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

/*
  The code, not the model, has the last word on the window: it must parse,
  run forwards, and stay within five years. Timing questions with no stated
  window look three years ahead; other forward-looking questions one year.
*/
function settleWindow(
  window: { start: string; end: string } | null,
  type: QuestionType,
  now: Date
): { start: string; end: string } | null {
  if (window) {
    const start = Date.parse(window.start);
    const end = Date.parse(window.end);

    if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) {
      const cappedEnd = Math.min(end, start + MAX_WINDOW_DAYS * DAY_MS);
      return { start: isoDate(new Date(start)), end: isoDate(new Date(cappedEnd)) };
    }
  }

  if (type === "timing") return { start: isoDate(now), end: isoDate(addMonths(now, 36)) };
  if (type === "yes_no" || type === "guidance") return { start: isoDate(now), end: isoDate(addMonths(now, 12)) };

  return null;
}

const SELF_HARM =
  /\b(suicid\w*|kill(ing)? myself|end(ing)? (my|this) life|take my (own )?life|self[- ]?harm|hurt(ing)? myself|no reason to live|(don'?t|do not) want to (live|be alive)|want to die|better off dead)\b/;

const DISTRESS =
  /\b(hopeless|can'?t cope|cannot cope|can'?t take (it|this) anymore|panic( attacks?)?|breaking down|falling apart|grie(f|ving)|can'?t (sleep|stop crying)|overwhelmed|no way out|completely alone)\b/;

const FEELINGS =
  /\b(tired|exhausted|fed up|sad|unhappy|lonely|anxious|anxiety|stressed|stress|depressed|feeling low|lost|stuck|frustrat\w*|angry|hurt|heartbroken|broken|worried|scared|afraid|crying|struggl\w*|unlucky|bad luck|bad phase|bad time|nothing (ever )?(works|goes right)|going wrong|everything is wrong|why me|feel(ing)? (bad|terrible|awful|empty|useless|worthless))\b/;

const DAILY = /\b(today|tonight|tomorrow|this week|this weekend|daily|horoscope|my day|the day ahead)\b/;

const OPTIMISE =
  /\b(make the most|most of (it|this)|good time to|right time to|auspicious|going well|going great|good phase|got (promoted|married|engaged|the job|selected)|new job|celebrat\w*|maximi[sz]e|capitali[sz]e|momentum)\b/;

const ASTROLOGY_ASK =
  /\b(astrolog\w*|chart|kundli|kundali|horoscope|dasha|mahadasha|antardasha|planets?|saturn|shani|jupiter|rahu|ketu|venus|mars|mercury|transits?|sade ?sati|nakshatra|ascendant|lagna|moon sign|sun sign|rising sign|dosha|manglik)\b/;

const REMEDY_ASK = /\b(remed\w*|upay\w*|upaa?ya|solutions?|what can i do|what should i do|how do i (fix|change|improve)|how can i (fix|change|improve)|mantra)\b/;

/* Keyword reading, used when no model is configured or the model call fails. */
export function keywordIntent(question: string, now: Date): QuestionIntent {
  const domains = DOMAIN_IDS.filter((id) => DOMAINS[id].keywords.test(question)).slice(0, 3);

  const q = question.toLowerCase();

  const questionType: QuestionType = /\b(when|which year|what year|how soon|how long|by when)\b/.test(q)
    ? "timing"
    : /^(will|is|am|are|can|should|do|does|shall)\b/.test(q.trim())
      ? "yes_no"
      : /\b(why|reason)\b/.test(q)
        ? "explanation"
        : /\b(how|what should|advice|guide|improve)\b/.test(q)
          ? "guidance"
          : "general";

  let window: { start: string; end: string } | null = null;
  const year = now.getUTCFullYear();

  const inYear = /\b(?:in|by|during)\s+(20\d{2})\b/.exec(q);
  const nextN = /\bnext\s+(\d{1,2})\s+(month|year)s?\b/.exec(q);

  if (inYear) {
    window = { start: `${inYear[1]}-01-01`, end: `${inYear[1]}-12-31` };
  } else if (/\bnext year\b/.test(q)) {
    window = { start: `${year + 1}-01-01`, end: `${year + 1}-12-31` };
  } else if (/\bthis year\b/.test(q)) {
    window = { start: isoDate(now), end: `${year}-12-31` };
  } else if (nextN) {
    const months = Number(nextN[1]) * (nextN[2] === "year" ? 12 : 1);
    window = { start: isoDate(now), end: isoDate(addMonths(now, months)) };
  }

  const sensitive: Sensitivity = SELF_HARM.test(q)
    ? "self_harm"
    : DISTRESS.test(q)
      ? "distress"
      : /\b(when will i die|death|lifespan|longevity|how long will i live)\b/.test(q)
        ? "longevity"
        : /\b(court|lawsuit|legal|police)\b/.test(q)
          ? "legal"
          : /\b(disease|surgery|cancer|medical|diagnos\w*|medicine)\b/.test(q)
            ? "medical"
            : /\b(stocks?|shares|crypto|invest\w*|trading)\b/.test(q)
              ? "financial"
              : "none";

  /* A question mark, or a sentence that opens with a question word. */
  const asks = /\?|(^|[.!,;]\s*)(why|when|will|should|what|how|which|can|is|are|do|does)\b(?!['’])/.test(q.trim());

  const need: Need =
    FEELINGS.test(q) || sensitive === "distress"
      ? asks
        ? "support_guidance"
        : "support"
      : DAILY.test(q)
        ? "daily"
        : OPTIMISE.test(q)
          ? "optimise"
          : "guidance";

  return {
    domains: domains.length ? domains : ["general"],
    questionType,
    window: settleWindow(window, questionType, now),
    sensitive,
    need,
    wantsRemedies: REMEDY_ASK.test(q),
    /* Keywords cannot tell; the caller treats an empty history as a new topic. */
    newTopic: false,
    wantsAstrology: ASTROLOGY_ASK.test(q),
    source: "keywords"
  };
}

const INTENT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["domains", "questionType", "windowStart", "windowEnd", "sensitive", "need", "wantsRemedies", "newTopic", "wantsAstrology"],
  properties: {
    domains: {
      type: "array",
      items: { type: "string", enum: [...DOMAIN_IDS] },
      description: "1 to 3 life areas the message is about, most relevant first"
    },
    questionType: { type: "string", enum: [...QUESTION_TYPES] },
    windowStart: {
      type: ["string", "null"],
      description: "YYYY-MM-DD start of the period asked about, or null if none is stated or implied"
    },
    windowEnd: { type: ["string", "null"], description: "YYYY-MM-DD end of that period, or null" },
    sensitive: { type: "string", enum: [...SENSITIVITIES] },
    need: { type: "string", enum: [...NEEDS] },
    wantsRemedies: { type: "boolean" },
    newTopic: { type: "boolean" },
    wantsAstrology: { type: "boolean" }
  }
};

export interface IntentContext {
  /* Why the person said they came to Saarthi, from onboarding. A hint, never decisive. */
  entryReason?: string;
}

export async function classifyQuestion(
  question: string,
  history: ChatMessage[],
  now: Date,
  context: IntentContext = {}
): Promise<QuestionIntent> {
  if (!llmAvailable()) return keywordIntent(question, now);

  const domainList = DOMAIN_IDS.map((id) => `- ${id}: ${DOMAINS[id].label}`).join("\n");

  const recent = history
    .slice(-4)
    .map((m) => `${m.role}: ${m.content.slice(0, 400)}`)
    .join("\n");

  const hint = context.entryReason ? `\nWhy they first came to Saarthi (a hint only): "${context.entryReason}"` : "";

  try {
    const result = await jsonCompletion<{
      domains: DomainId[];
      questionType: QuestionType;
      windowStart: string | null;
      windowEnd: string | null;
      sensitive: Sensitivity;
      need: Need;
      wantsRemedies: boolean;
      newTopic: boolean;
      wantsAstrology: boolean;
    }>({
      model: models.intent(),
      temperature: 0,
      maxTokens: 250,
      schemaName: "question_intent",
      schema: INTENT_SCHEMA,
      messages: [
        {
          role: "system",
          content: `You read messages sent to Saarthi, a companion that uses Vedic astrology and everyday psychology to support people. Today is ${isoDate(now)}.

Life areas:
${domainList}

questionType: "timing" asks when something will happen; "yes_no" asks whether it will; "guidance" asks what to do; "explanation" asks why something is the way it is; otherwise "general".

need, what the person wants from this message (they never say it; infer it):
- "support": they are struggling or venting and want to be heard and steadied, with no real chart question ("I'm exhausted, nothing works out for me").
- "guidance": they want to understand a matter or how to go forward ("Should I switch jobs this year?", "How is my marriage looking?").
- "support_guidance": both: clearly struggling, and also asking why, when it ends, or what to do ("Everything is going wrong, when will this end?").
- "daily": a routine check-in about today, tomorrow or this week ("How's today looking?", "What should I focus on this week?").
- "optimise": things are going well or they want to make good use of a promising time ("I just got promoted, how do I make the most of it?", "Is this a good time to start my business?").

wantsRemedies: true when they ask what they can do about it: remedies, upay, mantras, solutions, "what can I do".

newTopic: this is one continuous chat with no separate threads. true when the message brings up a problem, decision or life area that the recent conversation was not about (or there is no recent conversation). false for follow-ups, replies to Saarthi's questions, thanks, small talk, or more detail on the same matter.

wantsAstrology: true only when they ask about the astrology itself: their chart, dasha or periods, planets, transits, Sade Sati, yogas or doshas, or "why is this happening astrologically". false for ordinary life questions, even ones about timing ("when will things get better?").

Resolve relative periods against today ("next year", "in the coming months", "after my exams in March"). Leave the window null if no period is stated or clearly implied.

sensitive: "self_harm" for any hint of self-harm or suicide; "distress" only for acute emotional strain short of that (hopeless, can't cope, panic attacks, grief, falling apart, not sleeping or eating for days), never for everyday stress, disappointment, self-doubt or a bad day at work; "longevity" for questions about death or lifespan; "medical", "legal" or "financial" (investments, trading) when the message asks for a decision in that field; otherwise "none".

Use the conversation so far to resolve follow-ups such as "and what about tomorrow?" or "thanks, that helps".${hint}`
        },
        {
          role: "user",
          content: recent ? `Conversation so far:\n${recent}\n\nMessage: ${question}` : `Message: ${question}`
        }
      ]
    });

    const domains = result.domains.filter((d) => DOMAIN_IDS.includes(d)).slice(0, 3);

    return {
      domains: domains.length ? domains : ["general"],
      questionType: result.questionType,
      window: settleWindow(
        result.windowStart && result.windowEnd ? { start: result.windowStart, end: result.windowEnd } : null,
        result.questionType,
        now
      ),
      sensitive: result.sensitive,
      need: NEEDS.includes(result.need) ? result.need : "guidance",
      wantsRemedies: result.wantsRemedies === true,
      newTopic: result.newTopic === true,
      wantsAstrology: result.wantsAstrology === true,
      source: "llm"
    };
  } catch (error) {
    console.warn("INTENT_FALLBACK", (error as Error).message);
    return keywordIntent(question, now);
  }
}
