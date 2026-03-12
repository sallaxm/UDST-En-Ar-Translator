import { NextResponse } from "next/server";
import { PDFDocument, PDFName } from "pdf-lib";
import { inflateRawSync } from "node:zlib";

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
const DAILY_FREE_TRANSLATIONS = Number.parseInt(
  process.env.DAILY_FREE_TRANSLATIONS || "5",
  10
);
const PADDLE_CHECKOUT_URL = process.env.PADDLE_CHECKOUT_URL || "";

const SUBSCRIPTION_PRICE_USD = 14;
const SUBSCRIPTION_TERM_MONTHS = 4;

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
  details?: Record<string, unknown>;

  constructor(message: string, status = 500, details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type DailyUsageEntry = {
  count: number;
  dayKey: string;
};

type GlobalWithFreeTierStore = typeof globalThis & {
  explainRouteDailyUsageStore?: Map<string, DailyUsageEntry>;
};

const dailyUsageStore =
  (globalThis as GlobalWithFreeTierStore).explainRouteDailyUsageStore ||
  new Map<string, DailyUsageEntry>();

(globalThis as GlobalWithFreeTierStore).explainRouteDailyUsageStore = dailyUsageStore;

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

function hasActiveSubscription(req: Request) {
  const subscriptionHeader = req.headers.get("x-subscription-active");
  if (subscriptionHeader && subscriptionHeader.toLowerCase() === "true") {
    return true;
  }

  const cookieHeader = req.headers.get("cookie") || "";
  return /(?:^|;\s*)translator_subscribed=true(?:;|$)/.test(cookieHeader);
}

function getCurrentDayKey() {
  return new Date().toISOString().slice(0, 10);
}

function enforceFreeTier(req: Request) {
  if (hasActiveSubscription(req)) {
    return;
  }

  if (Number.isNaN(DAILY_FREE_TRANSLATIONS) || DAILY_FREE_TRANSLATIONS <= 0) {
    throw new ApiError("Free tier configuration is invalid.", 500);
  }

  const clientId = getRequestClientId(req);
  const dayKey = getCurrentDayKey();
  const usage = dailyUsageStore.get(clientId);

  if (!usage || usage.dayKey !== dayKey) {
    dailyUsageStore.set(clientId, { count: 1, dayKey });
    return;
  }

  if (usage.count >= DAILY_FREE_TRANSLATIONS) {
    throw new ApiError(
      `You've used all ${DAILY_FREE_TRANSLATIONS} free translations for today. Subscribe for $${SUBSCRIPTION_PRICE_USD} every ${SUBSCRIPTION_TERM_MONTHS} months to continue.`,
      402,
      {
        code: "SUBSCRIPTION_REQUIRED",
        dailyFreeTranslations: DAILY_FREE_TRANSLATIONS,
        subscriptionPriceUsd: SUBSCRIPTION_PRICE_USD,
        subscriptionTermMonths: SUBSCRIPTION_TERM_MONTHS,
        checkoutUrl: PADDLE_CHECKOUT_URL || null,
      }
    );
  }

  usage.count += 1;
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

function normalizeExtractedText(text: string) {
  return text.replace(/\u0000/g, "").replace(/\s+/g, " ").trim();
}

function decodePdfLiteralString(value: string) {
  return value
    .replace(/\\([nrtbf()\\])/g, (_, ch: string) => {
      const map: Record<string, string> = {
        n: "\n",
        r: "\r",
        t: "\t",
        b: "\b",
        f: "\f",
        "(": "(",
        ")": ")",
        "\\": "\\",
      };
      return map[ch] || ch;
    })
    .replace(/\\([0-7]{1,3})/g, (_, oct: string) => String.fromCharCode(Number.parseInt(oct, 8)));
}

function extractTextFromPdfOperators(streamText: string) {
  const matches = streamText.matchAll(/\((?:\.|[^\)])*\)\s*Tj|\[(?:.|\n|\r)*?\]\s*TJ/g);
  const chunks: string[] = [];

  for (const match of matches) {
    const token = match[0];

    if (token.endsWith("Tj")) {
      const literal = token.match(/\(((?:\.|[^\)])*)\)\s*Tj$/);
      if (literal?.[1]) {
        chunks.push(decodePdfLiteralString(literal[1]));
      }
      continue;
    }

    const arrayStrings = token.matchAll(/\(((?:\.|[^\)])*)\)/g);
    for (const item of arrayStrings) {
      if (item[1]) {
        chunks.push(decodePdfLiteralString(item[1]));
      }
    }
  }

  return chunks.join(" ");
}


async function extractPdfText(file: File) {
  const bytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(bytes);

  const extractedParts: string[] = [];

  for (const page of pdfDoc.getPages()) {
    const node = page.node as unknown as {
      dict: {
        get(name: PDFName): unknown;
      };
      context: {
        lookup(value: unknown): { getUnencodedContents?: () => Uint8Array[] } | undefined;
      };
    };

    const contentsRef = node.dict.get(PDFName.of("Contents"));
    if (!contentsRef) continue;

    const lookedUp = node.context.lookup(contentsRef);
    const streams = lookedUp?.getUnencodedContents?.() || [];

    for (const stream of streams) {
      const streamText = Buffer.from(stream).toString("latin1");
      const parsedText = extractTextFromPdfOperators(streamText);
      if (parsedText) {
        extractedParts.push(parsedText);
      }
    }
  }

  return normalizeExtractedText(extractedParts.join(" "));
}

async function extractZipEntryText(file: File, entryPattern: RegExp) {
  const bytes = await file.arrayBuffer();
  const archive = Buffer.from(bytes);

  const textDecoder = new TextDecoder();
  const signature = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
  const contents: string[] = [];

  let offset = 0;
  while (offset < archive.length) {
    const entryOffset = archive.indexOf(signature, offset);
    if (entryOffset < 0) break;

    const compressionMethod = archive.readUInt16LE(entryOffset + 8);
    const compressedSize = archive.readUInt32LE(entryOffset + 18);
    const fileNameLength = archive.readUInt16LE(entryOffset + 26);
    const extraLength = archive.readUInt16LE(entryOffset + 28);

    const fileNameStart = entryOffset + 30;
    const fileNameEnd = fileNameStart + fileNameLength;
    const fileName = archive.toString("utf8", fileNameStart, fileNameEnd);

    const dataStart = fileNameEnd + extraLength;
    const dataEnd = dataStart + compressedSize;

    if (entryPattern.test(fileName) && dataEnd <= archive.length) {
      const entryData = archive.subarray(dataStart, dataEnd);
      let xml = "";

      if (compressionMethod === 0) {
        xml = textDecoder.decode(entryData);
      } else if (compressionMethod === 8) {
        xml = textDecoder.decode(inflateRawSync(entryData));
      }

      if (xml) {
        const plain = xml.replace(/<[^>]+>/g, " ").replace(/&[^;]+;/g, " ");
        contents.push(plain);
      }
    }

    offset = dataEnd;
  }

  return normalizeExtractedText(contents.join(" "));
}

async function extractWordText(file: File) {
  return extractZipEntryText(file, /^word\/.+\.xml$/i);
}

async function extractPowerPointText(file: File) {
  return extractZipEntryText(file, /^ppt\/slides\/slide\d+\.xml$/i);
}

function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function isWord(file: File) {
  const name = file.name.toLowerCase();
  return (
    file.type.includes("word") ||
    file.type.includes("officedocument.wordprocessingml") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx")
  );
}

function isPowerPoint(file: File) {
  const name = file.name.toLowerCase();
  return (
    file.type.includes("presentation") ||
    file.type.includes("powerpoint") ||
    name.endsWith(".ppt") ||
    name.endsWith(".pptx")
  );
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const text = formData.get("text");
    const file = formData.get("file");

    if (!(typeof text === "string" && text.trim()) && !(file instanceof File)) {
      throw new ApiError("No text or file provided.", 400);
    }

    enforceRateLimit(req);
    enforceFreeTier(req);

    if (typeof text === "string" && text.trim()) {
      const result = await analyzeText(text);
      return NextResponse.json(result);
    }

    if (file instanceof File) {
      if (file.type.startsWith("image/")) {
        const result = await analyzeImage(file);
        return NextResponse.json(result);
      }

      if (isPdf(file)) {
        const extractedText = await extractPdfText(file);
        if (!extractedText) {
          throw new ApiError("No readable text was found in this PDF.", 400);
        }
        const result = await analyzeText(extractedText);
        return NextResponse.json(result);
      }

      if (isWord(file)) {
        const extractedText = await extractWordText(file);
        if (!extractedText) {
          throw new ApiError("No readable text was found in this Word document.", 400);
        }
        const result = await analyzeText(extractedText);
        return NextResponse.json(result);
      }

      if (isPowerPoint(file)) {
        const extractedText = await extractPowerPointText(file);
        if (!extractedText) {
          throw new ApiError("No readable text was found in this PowerPoint file.", 400);
        }
        const result = await analyzeText(extractedText);
        return NextResponse.json(result);
      }

      throw new ApiError("Supported uploads: images, PDF, Word, and PowerPoint files.", 400);
    }

    throw new ApiError("No text or file provided.", 400);
  } catch (error) {
    console.error(error);

    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, ...(error.details || {}) },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Failed to process request." },
      { status: 500 }
    );
  }
}
