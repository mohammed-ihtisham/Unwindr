import { GoogleGenerativeAI } from "npm:@google/generative-ai@^0.21.0";

// Configuration for Gemini API
interface GenConfig {
  apiKey: string;
  model?: string;
  maxOutputTokens?: number;
  timeoutMs?: number;
}

// Load configuration from environment variables
function loadConfig(): GenConfig {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error(
      "Missing GEMINI_API_KEY environment variable. Set it in your .env file or environment.",
    );
  }
  return {
    apiKey,
    model: Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash-exp",
    maxOutputTokens: parseInt(Deno.env.get("GEMINI_MAX_TOKENS") || "256"),
    timeoutMs: parseInt(Deno.env.get("GEMINI_TIMEOUT_MS") || "20000"),
  };
}

const CFG = loadConfig();
const genAI = new GoogleGenerativeAI(CFG.apiKey);

// Utility to add timeout to promises
async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timeoutId: number | undefined;
  const timeout = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error("LLM timeout exceeded")),
      ms,
    );
  });
  try {
    const result = await Promise.race([p, timeout]);
    return result as T;
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

// Parse JSON from AI response, handling code fences
function parseJsonLoose(text: string): any {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;
  return JSON.parse(candidate);
}

/**
 * Call Gemini API with JSON response format and retry logic
 * @param prompt The prompt to send to the LLM
 * @returns Parsed JSON response
 */
export async function callGeminiJSON(prompt: string): Promise<any> {
  const model = genAI.getGenerativeModel({
    model: CFG.model ?? "gemini-2.0-flash-exp",
    generationConfig: {
      maxOutputTokens: CFG.maxOutputTokens ?? 256,
      responseMimeType: "application/json",
    },
  });

  const attemptOnce = async () => {
    const res = await model.generateContent(prompt);
    const text = res.response.text();
    return parseJsonLoose(text);
  };

  // Retry logic with exponential backoff
  const maxRetries = 2;
  let tryCount = 0;
  while (true) {
    try {
      const json = await withTimeout(
        attemptOnce(),
        CFG.timeoutMs ?? 20_000,
      );
      return json;
    } catch (err: any) {
      if (tryCount >= maxRetries) {
        const reason = err?.message ?? String(err);
        throw new Error(
          `LLM call failed after ${maxRetries + 1} attempts: ${reason}`,
        );
      }
      const delayMs = 300 * Math.pow(2, tryCount);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      tryCount += 1;
    }
  }
}

/**
 * Call Gemini API for plain text responses (not used in main pipeline)
 * @param prompt The prompt to send to the LLM
 * @returns Plain text response
 */
export async function callGeminiText(prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: CFG.model ?? "gemini-2.0-flash-exp",
    generationConfig: {
      maxOutputTokens: CFG.maxOutputTokens ?? 256,
    },
  });

  const once = async () => {
    const res = await model.generateContent(prompt);
    return res.response.text();
  };

  return withTimeout(once(), CFG.timeoutMs ?? 20_000);
}
