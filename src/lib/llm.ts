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

export const models = {
  answer: () => process.env.OPENAI_MODEL || "gpt-4o-mini",
  intent: () => process.env.OPENAI_INTENT_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini"
};

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
  const response = await getClient().chat.completions.create({
    model,
    temperature,
    max_tokens: maxTokens,
    messages,
    response_format: {
      type: "json_schema",
      json_schema: { name: schemaName, strict: true, schema }
    }
  });

  const choice = response.choices[0];

  if (choice?.message?.refusal) {
    throw new Error(`Model refused: ${choice.message.refusal}`);
  }

  const content = choice?.message?.content;
  if (!content) {
    throw new Error("Model returned no content");
  }

  return JSON.parse(content) as T;
}
