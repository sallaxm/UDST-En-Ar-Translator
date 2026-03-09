import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const RATE_LIMIT_MAX_REQUESTS = Number.parseInt(
  process.env.API_RATE_LIMIT_MAX_REQUESTS || "10",
  10
);
const RATE_LIMIT_WINDOW_MS = Number.parseInt(
  process.env.API_RATE_LIMIT_WINDOW_MS || "60000",
  10
);

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type GlobalWithRateLimitStore = typeof globalThis & {
  explainRouteRateLimitStore?: Map<string, RateLimitEntry>;
};

const rateLimitStore =
  (globalThis as GlobalWithRateLimitStore).explainRouteRateLimitStore ||
  new Map<string, RateLimitEntry>();

(globalThis as GlobalWithRateLimitStore).explainRouteRateLimitStore = rateLimitStore;

class ApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

type GeminiPart = {
  text: string;
};

type GeminiInlineData = {
  mime_type: string;
  data: string;
};

function ensureApiKey() {
  if (!apiKey) {
    throw new ApiError(
      "Missing AI API key. Set GEMINI_API_KEY (or GOOGLE_API_KEY) in your environment.",
      503
    );
  }
}

function parseModelJson(textOutput: string) {
  const trimmed = textOutput.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fencedMatch?.[1]) {
      return JSON.parse(fencedMatch[1].trim());
    }

    throw new ApiError("Model returned an invalid response format.", 502);
  }
}

function getRequestClientId(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown-client";
}

function enforceRateLimit(req: Request) {
  if (
    Number.isNaN(RATE_LIMIT_MAX_REQUESTS) ||
    Number.isNaN(RATE_LIMIT_WINDOW_MS) ||
    RATE_LIMIT_MAX_REQUESTS <= 0 ||
    RATE_LIMIT_WINDOW_MS <= 0
  ) {
    throw new ApiError("Rate limit configuration is invalid.", 500);
  }

  const now = Date.now();

  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }

  const clientId = getRequestClientId(req);
  const existing = rateLimitStore.get(clientId);

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(clientId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return;
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    throw new ApiError(
      `Rate limit exceeded. Try again in ${Math.ceil((existing.resetAt - now) / 1000)} seconds.`,
      429
    );
  }

  existing.count += 1;
}

async function generateWithGemini(parts: Array<{ text?: string; inline_data?: GeminiInlineData }>) {
  ensureApiKey();

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts,
        },
      ],
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.error?.message || "AI provider request failed.";
    throw new ApiError(message, response.status === 429 ? 429 : 502);
  }

  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part: GeminiPart) => part.text)
    .filter(Boolean)
    .join("\n")
    ?.trim();

  if (!text) {
    throw new ApiError("AI provider returned an empty response.", 502);
  }

  return parseModelJson(text);
}

async function analyzeText(text: string) {
  const prompt = `
You help university students understand lecture material.

Return JSON in this exact format:

{
  "simple": "simple english explanation",
  "arabicExplanation": "arabic explanation",
  "arabicTranslation": "direct arabic translation",
  "keywords": [
    { "en": "keyword", "ar": "arabic translation" }
  ]
}

Rules:
- simple English for non-native students
- Arabic should be clear
- return 4 to 6 keywords
- JSON only

Text:
${text}
`;

  return generateWithGemini([{ text: prompt }]);
}

async function analyzeImage(file: File) {
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  const prompt = `
Read this lecture slide and explain it.

Return JSON in this exact format:

{
  "simple": "simple english explanation",
  "arabicExplanation": "arabic explanation",
  "arabicTranslation": "direct arabic translation",
  "keywords": [
    { "en": "keyword", "ar": "arabic translation" }
  ]
}

Rules:
- simple English
- Arabic explanation
- 4 to 6 keywords
- JSON only
`;

  return generateWithGemini([
    { text: prompt },
    {
      inline_data: {
        mime_type: file.type,
        data: base64,
      },
    },
  ]);
}

export async function POST(req: Request) {
  try {
    enforceRateLimit(req);

    const formData = await req.formData();

    const text = formData.get("text");
    const file = formData.get("file");

    if (typeof text === "string" && text.trim()) {
      const result = await analyzeText(text);
      return NextResponse.json(result);
    }

    if (file instanceof File) {
      if (file.type.startsWith("image/")) {
        const result = await analyzeImage(file);
        return NextResponse.json(result);
      }

      throw new ApiError("Only image uploads are supported for now.", 400);
    }

    throw new ApiError("No text or file provided.", 400);
  } catch (error) {
    console.error(error);

    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "Failed to process request." },
      { status: 500 }
    );
  }
}
