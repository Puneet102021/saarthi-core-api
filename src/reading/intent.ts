import { ChatMessage, jsonCompletion, llmAvailable, models } from "../lib/llm";
import { DOMAINS, DOMAIN_IDS, DomainId } from "./domains";

export const QUESTION_TYPES = ["timing", "yes_no", "guidance", "explanation", "general"] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export const SENSITIVITIES = ["none", "medical", "legal", "financial", "longevity", "self_harm"] as const;

export type Sensitivity = (typeof SENSITIVITIES)[number];

export interface QuestionIntent {
  domains: DomainId[];
  questionType: QuestionType;
  /* The period the question is about, if any; dates are YYYY-MM-DD. */
  window: { start: string; end: string } | null;
  sensitive: Sensitivity;
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

  const sensitive: Sensitivity = /\b(suicid\w*|kill(ing)? myself|end(ing)? (my|this) life|take my (own )?life|self[- ]?harm|hurt(ing)? myself|no reason to live|(don'?t|do not) want to (live|be alive)|want to die|better off dead)\b/.test(q)
    ? "self_harm"
    : /\b(when will i die|death|lifespan|longevity|how long will i live)\b/.test(q)
      ? "longevity"
      : /\b(court|lawsuit|legal|police)\b/.test(q)
        ? "legal"
        : /\b(disease|surgery|cancer|medical|diagnos\w*|medicine)\b/.test(q)
          ? "medical"
          : /\b(stocks?|shares|crypto|invest\w*|trading)\b/.test(q)
            ? "financial"
            : "none";

  return {
    domains: domains.length ? domains : ["general"],
    questionType,
    window: settleWindow(window, questionType, now),
    sensitive,
    source: "keywords"
  };
}

const INTENT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["domains", "questionType", "windowStart", "windowEnd", "sensitive"],
  properties: {
    domains: {
      type: "array",
      items: { type: "string", enum: [...DOMAIN_IDS] },
      description: "1 to 3 life areas the question is about, most relevant first"
    },
    questionType: { type: "string", enum: [...QUESTION_TYPES] },
    windowStart: {
      type: ["string", "null"],
      description: "YYYY-MM-DD start of the period asked about, or null if none is stated or implied"
    },
    windowEnd: { type: ["string", "null"], description: "YYYY-MM-DD end of that period, or null" },
    sensitive: { type: "string", enum: [...SENSITIVITIES] }
  }
};

export async function classifyQuestion(
  question: string,
  history: ChatMessage[],
  now: Date
): Promise<QuestionIntent> {
  if (!llmAvailable()) return keywordIntent(question, now);

  const domainList = DOMAIN_IDS.map((id) => `- ${id}: ${DOMAINS[id].label}`).join("\n");

  const recent = history
    .slice(-4)
    .map((m) => `${m.role}: ${m.content.slice(0, 400)}`)
    .join("\n");

  try {
    const result = await jsonCompletion<{
      domains: DomainId[];
      questionType: QuestionType;
      windowStart: string | null;
      windowEnd: string | null;
      sensitive: Sensitivity;
    }>({
      model: models.intent(),
      temperature: 0,
      maxTokens: 200,
      schemaName: "question_intent",
      schema: INTENT_SCHEMA,
      messages: [
        {
          role: "system",
          content: `You classify questions put to a Vedic astrology assistant. Today is ${isoDate(now)}.

Life areas:
${domainList}

questionType: "timing" asks when something will happen; "yes_no" asks whether it will; "guidance" asks what to do; "explanation" asks why something is the way it is; otherwise "general".

Resolve relative periods against today ("next year", "in the coming months", "after my exams in March"). Leave the window null if no period is stated or clearly implied.

sensitive: "self_harm" for any hint of self-harm or suicide; "longevity" for questions about death or lifespan; "medical", "legal" or "financial" (investments, trading) when the question asks for a decision in that field; otherwise "none".

Use the conversation so far to resolve follow-ups such as "and what about next year?".`
        },
        {
          role: "user",
          content: recent ? `Conversation so far:\n${recent}\n\nQuestion: ${question}` : `Question: ${question}`
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
      source: "llm"
    };
  } catch (error) {
    console.warn("INTENT_FALLBACK", (error as Error).message);
    return keywordIntent(question, now);
  }
}
