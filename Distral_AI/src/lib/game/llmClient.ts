import { chat as mistralChat } from "./mistralClient";
import { chat as bedrockChat } from "./bedrockClient";
import type { ChatMessage } from "./promptBuilder";

type ChatOptions = {
  model?: string;
  temperature?: number;
  jsonMode?: boolean;
  maxTokens?: number;
};

export async function chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<string> {
  const useBedrock = process.env.USE_AWS_BEDROCK === "true";
  if (useBedrock) {
    return bedrockChat(messages, options);
  }
  return mistralChat(messages, options);
}
