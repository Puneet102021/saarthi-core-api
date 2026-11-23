import OpenAI from "openai";

/*
  The one place that talks to the language model. Models are configuration:
  OPENAI_MODEL for answers, OPENAI_INTENT_MODEL for reading the question.
*/

let client: OpenAI | null = null;

export function llmAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

function getClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

/*
  The answer model writes the reply; the intent model only reads the message,
  so a small, fast non-reasoning model is enough there.
*/
export const models = {
  answer: () => process.env.OPENAI_MODEL || "gpt-5.4-mini",
  intent: () => process.env.OPENAI_INTENT_MODEL || "gpt-4.1",
  /* Summarises the conversation and keeps long-term notes; runs after replies. */
  memory: () => process.env.OPENAI_MEMORY_MODEL || "gpt-4.1-mini"
};

export function isReasoningModel(model: string): boolean {
  return /^(o\d|gpt-[5-9])/.test(model);
}

/* OPENAI_REASONING_EFFORT: minimal, low (default), medium or high. */
function reasoningEffort(): "minimal" | "low" | "medium" | "high" {
  const value = process.env.OPENAI_REASONING_EFFORT;
  return value === "minimal" || value === "medium" || value === "high" ? value : "low";
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/* A chat completion constrained to a JSON schema (OpenAI structured outputs). */
export async function jsonCompletion<T>({
  model,
  messages,
  schemaName,
  schema,
  temperature = 0.4,
  maxTokens = 1500
}: {
  model: string;
  messages: ChatMessage[];
  schemaName: string;
  schema: Record<string, unknown>;
  temperature?: number;
  maxTokens?: number;
}): Promise<T> {
  const response_format = {
    type: "json_schema" as const,
    json_schema: { name: schemaName, strict: true, schema }
  };

  /*
    Reasoning models (o-series, GPT-5 and later) take no temperature and
    count their hidden reasoning against max_completion_tokens, so they get
    more room and low effort: the evidence is already chosen, the job is to
    write it up well.
  */
  const response = isReasoningModel(model)
    ? await getClient().chat.completions.create({
        model,
        messages,
        max_completion_tokens: maxTokens * 4,
        reasoning_effort: reasoningEffort(),
        response_format
      })
    : await getClient().chat.completions.create({
        model,
        temperature,
        max_tokens: maxTokens,
        messages,
        response_format
      });

  const choice = response.choices[0];

  if (choice?.finish_reason === "length") {
    throw new Error("Model ran out of tokens before finishing");
  }

  if (choice?.message?.refusal) {
    throw new Error(`Model refused: ${choice.message.refusal}`);
  }

  const content = choice?.message?.content;
  if (!content) {
    throw new Error("Model returned no content");
  }

  return JSON.parse(content) as T;
}
