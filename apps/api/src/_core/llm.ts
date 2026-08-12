import { getSupabase } from "../supabase";
import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4" ;
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  model?: string;
  thinking?: Record<string, unknown>;
  reasoning?: Record<string, unknown>;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

export const LLM_PROVIDER_TYPES = ["openai", "anthropic", "gemini", "nvidia", "custom"] as const;
export type LLMProviderType = (typeof LLM_PROVIDER_TYPES)[number];

export const LLM_TASK_TYPES = ["outline", "improve", "meta", "summarize", "agent_chat"] as const;
export type LLMTask = (typeof LLM_TASK_TYPES)[number];

export type ProviderRuntime = {
  id: string;
  providerType: LLMProviderType;
  name: string;
  baseUrl: string | null;
  apiKey: string;
  isActive: boolean;
};

export type ModelInfo = {
  id: string;
  object: string;
  created: number;
  owned_by: string;
};

export type ModelsResponse = {
  object: string;
  data: ModelInfo[];
};

export type ChatResult = {
  content: string;
  model: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
};

const PROVIDER_DEFAULT_BASE_URLS: Record<Exclude<LLMProviderType, "custom">, string> = {
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta",
  nvidia: "https://integrate.api.nvidia.com/v1",
};

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

const RETRY_MAX_RETRIES = 4;
const RETRY_BASE_DELAY_MS = 500;
const RETRY_MAX_DELAY_MS = 30_000;

type FetchInit = NonNullable<Parameters<typeof fetch>[1]>;

const sleep = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

const parseRetryAfter = (value: string | null): number | undefined => {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const at = Date.parse(value);
  return Number.isNaN(at) ? undefined : Math.max(0, at - Date.now());
};

// Equal-jitter exponential backoff. The cap/2 floor guarantees a minimum
// delay so a misbehaving caller loop slows down instead of hammering the
// upstream while it keeps returning errors.
const computeBackoffDelay = (
  attempt: number,
  retryAfterMs?: number
): number => {
  const cap = Math.min(RETRY_BASE_DELAY_MS * 2 ** attempt, RETRY_MAX_DELAY_MS);
  const jittered = cap / 2 + Math.random() * (cap / 2);
  return Math.min(Math.max(jittered, retryAfterMs ?? 0), RETRY_MAX_DELAY_MS);
};

// Retries non-2xx responses and network errors with exponential backoff, then
// returns the final Response so callers keep their existing error handling.
const fetchWithBackoff = async (
  url: string,
  init: FetchInit
): Promise<Response> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, init);
      if (response.ok || attempt === RETRY_MAX_RETRIES) {
        return response;
      }

      const retryAfterMs = parseRetryAfter(
        response.headers.get("retry-after")
      );
      try {
        await response.body?.cancel();
      } catch {
        // Body already settled; nothing to clean up.
      }
      console.warn(
        `LLM request retry ${attempt + 1}/${RETRY_MAX_RETRIES} after status ${response.status}`
      );
      await sleep(computeBackoffDelay(attempt, retryAfterMs));
    } catch (error) {
      lastError = error;
      if (attempt === RETRY_MAX_RETRIES) throw error;
      console.warn(
        `LLM request retry ${attempt + 1}/${RETRY_MAX_RETRIES} after network error`
      );
      await sleep(computeBackoffDelay(attempt));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("LLM request failed after exhausting retries");
};

const stringifyContent = (content: MessageContent | MessageContent[]): string => {
  const parts = ensureArray(content);
  return parts
    .map(part => (typeof part === "string" ? part : part.type === "text" ? part.text : JSON.stringify(part)))
    .join("\n");
};

// Splits OpenAI-style system messages out of a conversation for providers that
// model the system prompt separately (Anthropic, Gemini).
const splitSystemMessages = (messages: Message[]) => {
  const system = messages
    .filter(message => message.role === "system")
    .map(message => stringifyContent(message.content))
    .join("\n\n");
  const rest = messages
    .filter(message => message.role !== "system")
    .map(message => ({
      role: (message.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
      content: stringifyContent(message.content),
    }));
  return { system, rest };
};

const providerError = async (response: Response, operation: string) => {
  const text = await response.text().catch(() => "");
  return new Error(`${operation} failed: ${response.status} ${response.statusText}${text ? ` – ${text}` : ""}`);
};

const baseUrlFor = (provider: ProviderRuntime): string => {
  const fallback = PROVIDER_DEFAULT_BASE_URLS[provider.providerType as keyof typeof PROVIDER_DEFAULT_BASE_URLS] ?? "";
  const url = provider.baseUrl?.trim() || fallback;
  if (!url) throw new Error(`Provider ${provider.name} requires a base URL.`);
  return url.replace(/\/+$/, "");
};

async function openAICompatibleChat(
  provider: ProviderRuntime,
  opts: { model?: string; messages: Message[]; maxTokens?: number },
): Promise<ChatResult> {
  const payload: Record<string, unknown> = {
    messages: opts.messages.map(normalizeMessage),
  };
  if (opts.model) payload.model = opts.model;
  if (typeof opts.maxTokens === "number") payload.max_tokens = opts.maxTokens;

  const response = await fetchWithBackoff(`${baseUrlFor(provider)}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw await providerError(response, "LLM invoke");

  const json = (await response.json()) as { model?: string; choices?: Array<{ message?: { content?: unknown } }>; usage?: ChatResult["usage"] };
  const content = json.choices?.[0]?.message?.content ?? "";
  if (!content) throw new Error("The AI provider did not return usable content.");
  return {
    content: typeof content === "string" ? content : JSON.stringify(content),
    model: json.model ?? opts.model ?? "",
    usage: json.usage,
  };
}

async function anthropicChat(
  provider: ProviderRuntime,
  opts: { model?: string; messages: Message[]; maxTokens?: number },
): Promise<ChatResult> {
  if (!opts.model) throw new Error("Anthropic requires an explicit model.");
  const { system, rest } = splitSystemMessages(opts.messages);
  const payload: Record<string, unknown> = {
    model: opts.model,
    max_tokens: opts.maxTokens ?? 1024,
    messages: rest,
  };
  if (system) payload.system = system;

  const response = await fetchWithBackoff(`${baseUrlFor(provider)}/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": provider.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw await providerError(response, "LLM invoke");

  const json = (await response.json()) as {
    model?: string;
    content?: Array<{ type?: string; text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  const content = (json.content ?? [])
    .filter(part => part.type === "text")
    .map(part => part.text ?? "")
    .join("\n");
  if (!content) throw new Error("The AI provider did not return usable content.");
  const input = json.usage?.input_tokens ?? 0;
  const output = json.usage?.output_tokens ?? 0;
  return {
    content,
    model: json.model ?? opts.model,
    usage: { prompt_tokens: input, completion_tokens: output, total_tokens: input + output },
  };
}

async function geminiChat(
  provider: ProviderRuntime,
  opts: { model?: string; messages: Message[]; maxTokens?: number },
): Promise<ChatResult> {
  if (!opts.model) throw new Error("Gemini requires an explicit model.");
  const { system, rest } = splitSystemMessages(opts.messages);
  const payload: Record<string, unknown> = {
    contents: rest.map(message => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    })),
  };
  if (system) payload.system_instruction = { parts: [{ text: system }] };
  if (typeof opts.maxTokens === "number") payload.generationConfig = { maxOutputTokens: opts.maxTokens };

  const response = await fetchWithBackoff(
    `${baseUrlFor(provider)}/models/${encodeURIComponent(opts.model)}:generateContent?key=${encodeURIComponent(provider.apiKey)}`,
    { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) },
  );
  if (!response.ok) throw await providerError(response, "LLM invoke");

  const json = (await response.json()) as {
    model?: string;
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const content = (json.candidates?.[0]?.content?.parts ?? [])
    .map(part => part.text ?? "")
    .join("\n");
  if (!content) throw new Error("The AI provider did not return usable content.");
  return { content, model: json.model ?? opts.model };
}

export async function chatWithProvider(
  provider: ProviderRuntime,
  opts: { model?: string; messages: Message[]; maxTokens?: number },
): Promise<ChatResult> {
  if (provider.providerType === "anthropic") return anthropicChat(provider, opts);
  if (provider.providerType === "gemini") return geminiChat(provider, opts);
  return openAICompatibleChat(provider, opts);
}

export async function listProviderModels(provider: ProviderRuntime): Promise<ModelInfo[]> {
  const base = baseUrlFor(provider);

  if (provider.providerType === "anthropic") {
    const response = await fetchWithBackoff(`${base}/models`, {
      headers: { "x-api-key": provider.apiKey, "anthropic-version": "2023-06-01" },
    });
    if (!response.ok) throw await providerError(response, "List LLM models");
    const json = (await response.json()) as { data?: Array<{ id?: string; created?: number; display_name?: string; owner?: string }> };
    return (json.data ?? []).map(model => ({
      id: model.id ?? "",
      object: "model",
      created: model.created ?? 0,
      owned_by: model.owner ?? model.display_name ?? "",
    }));
  }

  if (provider.providerType === "gemini") {
    const response = await fetchWithBackoff(`${base}/models?key=${encodeURIComponent(provider.apiKey)}`, {});
    if (!response.ok) throw await providerError(response, "List LLM models");
    const json = (await response.json()) as { models?: Array<{ name?: string; displayName?: string }> };
    return (json.models ?? []).map(model => ({
      id: String(model.name ?? "").replace(/^models\//, ""),
      object: "model",
      created: 0,
      owned_by: model.displayName ?? "",
    }));
  }

  const response = await fetchWithBackoff(`${base}/models`, {
    headers: { authorization: `Bearer ${provider.apiKey}` },
  });
  if (!response.ok) throw await providerError(response, "List LLM models");
  const json = (await response.json()) as { data?: Array<{ id?: string; object?: string; created?: number; owned_by?: string }> };
  return (json.data ?? []).map(model => ({
    id: model.id ?? "",
    object: model.object ?? "model",
    created: model.created ?? 0,
    owned_by: model.owned_by ?? "",
  }));
}

export function maskApiKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "••••";
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}

type ResolvedConfig = { provider: ProviderRuntime; model: string };

const envConfig = (): ResolvedConfig | null => {
  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey?.trim()) {
    return {
      provider: {
        id: "env-openai",
        providerType: "openai",
        name: "OpenAI (environment)",
        baseUrl: process.env.OPENAI_BASE_URL?.trim() || null,
        apiKey: openAiKey.trim(),
        isActive: true,
      },
      model: process.env.OPENAI_MODEL?.trim() || "",
    };
  }
  if (ENV.forgeApiKey) {
    return {
      provider: {
        id: "env-forge",
        providerType: "custom",
        name: "Manus Forge (environment)",
        baseUrl: ENV.forgeApiUrl || null,
        apiKey: ENV.forgeApiKey,
        isActive: true,
      },
      model: "",
    };
  }
  return null;
};

// Resolves the effective provider + model for a task: scoped DB assignment
// first, then OPENAI_API_KEY / Manus Forge environment fallback.
export async function resolveTaskConfig(siteId: string, task: LLMTask): Promise<ResolvedConfig | null> {
  try {
    const db = getSupabase();
    const { data, error } = await db
      .from("llm_task_settings")
      .select("model, llm_providers(id, name, provider_type, base_url, api_key, is_active)")
      .eq("site_id", siteId)
      .eq("task", task)
      .maybeSingle();
    if (error) return envConfig();
    const provider = Array.isArray((data as any)?.llm_providers) ? (data as any).llm_providers[0] : (data as any)?.llm_providers;
    if (data?.model && provider?.is_active) {
      return {
        provider: {
          id: provider.id,
          providerType: provider.provider_type,
          name: provider.name,
          baseUrl: provider.base_url,
          apiKey: provider.api_key,
          isActive: provider.is_active,
        },
        model: data.model,
      };
    }
    return envConfig();
  } catch {
    return envConfig();
  }
}

// Runs a task against the configured provider/model, resolving assignment by
// site + task. Throws when no provider is configured anywhere.
export async function runTaskChat(
  siteId: string,
  task: LLMTask,
  messages: Message[],
  maxTokens?: number,
): Promise<{ content: string; model: string; providerId: string }> {
  const resolved = await resolveTaskConfig(siteId, task);
  if (!resolved) {
    throw new Error("No AI provider is configured. Add an API key in Studio → AI providers.");
  }
  const result = await chatWithProvider(resolved.provider, {
    model: resolved.model || undefined,
    messages,
    maxTokens,
  });
  return { ...result, providerId: resolved.provider.id };
}

// Backward-compatible entry point: routes through the environment-configured
// default provider and returns the OpenAI-compatible InvokeResult shape.
export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  const resolved = envConfig();
  if (!resolved) throw new Error("No AI provider is configured.");

  const result = await chatWithProvider(resolved.provider, {
    model: params.model ?? (resolved.model || undefined),
    messages: params.messages,
    maxTokens: params.maxTokens ?? params.max_tokens,
  });

  return {
    id: "local",
    created: Math.floor(Date.now() / 1000),
    model: result.model,
    choices: [{ index: 0, message: { role: "assistant", content: result.content }, finish_reason: "stop" }],
    usage: result.usage,
  };
}

// Backward-compatible model listing for the environment-configured provider.
export async function listLLMModels(): Promise<ModelsResponse> {
  const resolved = envConfig();
  if (!resolved) throw new Error("No AI provider is configured.");
  const models = await listProviderModels(resolved.provider);
  return { object: "list", data: models };
}
