import { NextResponse } from "next/server";
import OpenAI from "openai";
import "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

class ExplainApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ExplainApiError";
  }
}

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new ExplainApiError(
      "Missing OPENAI_API_KEY server environment variable. Add it to your .env.local file and restart the dev server.",
      503
    );
  }

  return new OpenAI({ apiKey });
}

async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function isPdfFile(file: File): boolean {
  const fileName = file.name?.toLowerCase() ?? "";
  return file.type === "application/pdf" || fileName.endsWith(".pdf");
}

async function extractTextFromPdf(file: File): Promise<string> {
  const buffer = await fileToBuffer(file);
  const parser = new PDFParse({ data: new Uint8Array(buffer) });

  try {
    const result = await parser.getText();
    return result.text.trim();
  } finally {
    await parser.destroy();
  }
}

function parseModelJson(content: string | null): Record<string, unknown> {
  if (!content) {
    throw new ExplainApiError(
      "The AI service returned an empty response. Please try again.",
      502
    );
  }

  try {
    return JSON.parse(content);
  } catch {
    throw new ExplainApiError(
      "The AI service returned an unexpected response format. Please try again.",
      502
    );
  }
}

async function analyzeText(text: string) {
  const client = getClient();
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `
You are helping university students understand course material.

Return valid JSON only with this exact shape:
{
  "simple": "simple english explanation",
  "arabicExplanation": "arabic explanation",
  "arabicTranslation": "direct arabic translation",
  "keywords": [
    { "en": "keyword 1", "ar": "arabic translation 1" },
    { "en": "keyword 2", "ar": "arabic translation 2" }
  ]
}

Rules:
- Keep simple English easy for non-native students
- Arabic text should be clear and natural
- Return 4 to 6 keywords
- No markdown
        `.trim(),
      },
      {
        role: "user",
        content: `Analyze this academic text:\n\n${text}`,
      },
    ],
  });

  return parseModelJson(response.choices[0].message.content);
}

async function analyzeImage(file: File) {
  const client = getClient();
  const buffer = await fileToBuffer(file);
  const mimeType = file.type || "image/jpeg";
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `
You are helping university students understand lecture material from images.

Read the image carefully and return valid JSON only with this exact shape:
{
  "simple": "simple english explanation",
  "arabicExplanation": "arabic explanation",
  "arabicTranslation": "direct arabic translation of the main visible text",
  "keywords": [
    { "en": "keyword 1", "ar": "arabic translation 1" },
    { "en": "keyword 2", "ar": "arabic translation 2" }
  ]
}

Rules:
- Extract the academic meaning from the image
- If the image contains text, use that text
- Keep simple English easy for non-native students
- Return 4 to 6 keywords
- No markdown
        `.trim(),
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Read this lecture image and generate the JSON output.",
          },
          {
            type: "image_url",
            image_url: {
              url: dataUrl,
            },
          },
        ],
      },
    ],
  });

  return parseModelJson(response.choices[0].message.content);
}

async function parseRequestInput(req: Request): Promise<{
  text: string | null;
  file: File | null;
}> {
  const contentType = req.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("application/json")) {
    let body: { text?: unknown };

    try {
      body = (await req.json()) as { text?: unknown };
    } catch {
      throw new ExplainApiError(
        'Invalid JSON body. Send JSON like { "text": "..." }.',
        400
      );
    }

    return {
      text: typeof body.text === "string" ? body.text : null,
      file: null,
    };
  }

  if (
    contentType.includes("multipart/form-data") ||
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType === ""
  ) {
    const formData = await req.formData();
    const text = formData.get("text");
    const file = formData.get("file");

    return {
      text: typeof text === "string" ? text : null,
      file: file instanceof File ? file : null,
    };
  }

  throw new ExplainApiError(
    "Unsupported content type. Send JSON with { text } or multipart/form-data with text/file.",
    415
  );
}

export async function POST(req: Request) {
  try {
    const { text, file } = await parseRequestInput(req);

    if (text && text.trim()) {
      const result = await analyzeText(text.trim());
      return NextResponse.json(result);
    }

    if (file) {
      if (file.type.startsWith("image/")) {
        const result = await analyzeImage(file);
        return NextResponse.json(result);
      }

      if (isPdfFile(file)) {
        const extractedText = await extractTextFromPdf(file);

        if (!extractedText.trim()) {
          return NextResponse.json(
            { error: "Could not extract text from PDF." },
            { status: 400 }
          );
        }

        const result = await analyzeText(extractedText);
        return NextResponse.json(result);
      }

      return NextResponse.json(
        {
          error:
            "PowerPoint is not supported yet. For now, export slides as PDF and upload the PDF.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "No text or file provided." },
      { status: 400 }
    );
  } catch (error) {
    console.error(error);

    if (error instanceof ExplainApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      const status =
        "status" in error && typeof error.status === "number"
          ? error.status
          : 502;

      return NextResponse.json(
        { error: `OpenAI request failed: ${error.message}` },
        { status }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong while processing the content." },
      { status: 500 }
    );
  }
}