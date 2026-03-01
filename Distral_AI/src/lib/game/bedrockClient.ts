import {
  BedrockRuntimeClient,
  ConverseCommand,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import type { ChatMessage } from "./promptBuilder";

const BEDROCK_MODEL_IDS: Record<string, string> = {
  "mistral-large-latest": "mistral.mistral-large-2407-v1:0",
  "mistral-large-2407": "mistral.mistral-large-2407-v1:0",
  "mistral-large-2402": "mistral.mistral-large-2402-v1:0",
  "mistral-small-latest": "mistral.mistral-small-2402-v1:0",
  "mistral-7b": "mistral.mistral-7b-instruct-v0:2",
};

const FALLBACK_MODEL_IDS = [
  "mistral.mistral-large-2402-v1:0",
  "mistral.mistral-large-2407-v1:0",
  "mistral.mistral-7b-instruct-v0:2",
];

const FALLBACK_REGIONS = ["us-east-1", "us-west-2"];

type ChatOptions = {
  model?: string;
  temperature?: number;
  jsonMode?: boolean;
  maxTokens?: number;
};

function ensureUserFirst(messages: ChatMessage[]): ChatMessage[] {
  const nonSystem = messages.filter((m) => m.role !== "system");
  if (nonSystem.length > 0 && nonSystem[0].role === "assistant") {
    const systemMessages = messages.filter((m) => m.role === "system");
    return [
      ...systemMessages,
      { role: "user" as const, content: "[The NPC initiated the conversation. Their message follows.]" },
      ...nonSystem,
    ];
  }
  return messages;
}

function buildMistral7bPrompt(messages: ChatMessage[]): string {
  const systemParts: string[] = [];
  const turns: string[] = [];
  for (const message of messages) {
    if (message.role === "system") {
      systemParts.push(message.content);
    } else if (message.role === "user") {
      turns.push(`User: ${message.content}`);
    } else if (message.role === "assistant") {
      turns.push(`Assistant: ${message.content}`);
    }
  }
  const systemBlock = systemParts.length > 0 ? `System: ${systemParts.join("\n\n")}\n\n` : "";
  let prompt = `<s>[INST] ${systemBlock}`;
  for (let index = 0; index < turns.length; index++) {
    const turn = turns[index];
    const isUser = turn.startsWith("User: ");
    if (isUser) {
      prompt += turn.replace(/^User: /, "") + (index < turns.length - 1 ? " [/INST] " : " [/INST]");
    } else {
      prompt += turn.replace(/^Assistant: /, "") + "</s>[INST] ";
    }
  }
  return prompt;
}

async function chatViaInvokeModel(
  client: BedrockRuntimeClient,
  modelId: string,
  messages: ChatMessage[],
  temperature: number,
  maxTokens: number
): Promise<string> {
  const normalized = ensureUserFirst(messages);
  const is7b = modelId.includes("7b");
  let body: string;
  if (is7b) {
    const prompt = buildMistral7bPrompt(normalized);
    body = JSON.stringify({ prompt, max_tokens: maxTokens, temperature, top_p: 0.9 });
  } else {
    const chatMessages = normalized.map((m) => ({ role: m.role, content: m.content }));
    body = JSON.stringify({
      messages: chatMessages,
      max_tokens: maxTokens,
      temperature,
      top_p: 0.9,
    });
  }
  const command = new InvokeModelCommand({
    modelId,
    contentType: "application/json",
    accept: "application/json",
    body: new TextEncoder().encode(body),
  });
  const response = await client.send(command);
  const decoded = new TextDecoder().decode(response.body);
  const parsed = JSON.parse(decoded) as {
    outputs?: Array<{ text?: string }>;
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = parsed.outputs?.[0]?.text ?? parsed.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("Bedrock InvokeModel response did not include text content");
  }
  return text.trim();
}

async function chatViaConverse(
  client: BedrockRuntimeClient,
  modelId: string,
  messages: ChatMessage[],
  temperature: number,
  maxTokens: number
): Promise<string> {
  const normalized = ensureUserFirst(messages);
  const systemMessages = normalized.filter((m) => m.role === "system");
  const conversationMessages = normalized
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: [{ text: m.content }],
    }));
  const systemContent = systemMessages.length > 0
    ? [{ text: systemMessages.map((m) => m.content).join("\n\n") }]
    : undefined;
  const command = new ConverseCommand({
    modelId,
    messages: conversationMessages,
    system: systemContent,
    inferenceConfig: {
      maxTokens,
      temperature,
      topP: 0.9,
    },
  });
  const response = await client.send(command);
  const content = response.output?.message?.content;
  if (!content || content.length === 0) {
    throw new Error("Bedrock Converse response did not include any content.");
  }
  return content.map((block) => ("text" in block ? block.text : "")).join("");
}

function isModelInvalidError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("model identifier is invalid") ||
    message.includes("ValidationException") ||
    message.includes("Could not find the model")
  );
}

function isConversationStartError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("conversation must start with a user message");
}

export async function chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<string> {
  const region = process.env.AWS_REGION ?? "us-east-1";
  const modelIdOverride = process.env.BEDROCK_MODEL_ID?.trim();
  const resolvedModelId = modelIdOverride ?? (() => {
    const modelKey = (options.model ?? process.env.MISTRAL_MODEL ?? "mistral-large-latest").trim();
    return BEDROCK_MODEL_IDS[modelKey] ?? modelKey;
  })();
  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens ?? 1024;

  const modelsToTry = modelIdOverride
    ? [resolvedModelId]
    : [resolvedModelId, ...FALLBACK_MODEL_IDS.filter((id) => id !== resolvedModelId)];
  const regionsToTry = [region, ...FALLBACK_REGIONS.filter((r) => r !== region)];

  let lastError: Error | null = null;
  for (const tryRegion of regionsToTry) {
    const client = new BedrockRuntimeClient({ region: tryRegion });
    for (const tryModelId of modelsToTry) {
      try {
        return await chatViaConverse(client, tryModelId, messages, temperature, maxTokens);
      } catch (error) {
        const shouldFallback = isModelInvalidError(error) || isConversationStartError(error);
        if (!shouldFallback) {
          throw error;
        }
        lastError = error instanceof Error ? error : new Error(String(error));
        try {
          return await chatViaInvokeModel(client, tryModelId, messages, temperature, maxTokens);
        } catch (invokeError) {
          if (!isModelInvalidError(invokeError)) {
            throw invokeError;
          }
          lastError = invokeError instanceof Error ? invokeError : new Error(String(invokeError));
        }
      }
    }
  }

  throw new Error(
    `Bedrock: all models/regions failed. Last error: ${lastError?.message ?? "unknown"}. ` +
    "Enable model access in Bedrock console (Model access > Manage model access > Mistral AI). " +
    "Ensure IAM has bedrock:InvokeModel and aws-marketplace:Subscribe."
  );
}
