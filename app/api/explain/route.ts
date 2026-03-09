import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

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
