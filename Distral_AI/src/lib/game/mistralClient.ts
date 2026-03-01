import { Mistral } from "@mistralai/mistralai";
import type { ChatMessage } from "./promptBuilder";

type ChatOptions = {
  model?: string;
  temperature?: number;
  jsonMode?: boolean;
};

export async function chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error("MISTRAL_API_KEY is not set in environment variables.");
  }

  const model = options.model ?? process.env.MISTRAL_MODEL ?? "mistral-large-latest";
  const temperature = options.temperature ?? 0.7;

  const client = new Mistral({ apiKey });

  const requestParams: Record<string, unknown> = {
    model,
    messages,
    temperature,
  };

  if (options.jsonMode) {
    requestParams.responseFormat = { type: "json_object" };
  }

  const response = await client.chat.complete(requestParams as Parameters<typeof client.chat.complete>[0]);

  if (!response || !response.choices || response.choices.length === 0) {
    throw new Error("Mistral response did not include any choices.");
  }

  const content = response.choices[0].message.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((chunk) => typeof chunk === "string" ? chunk : "").join("");
  return "";
}
