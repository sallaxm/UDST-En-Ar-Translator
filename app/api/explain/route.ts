import { NextResponse } from "next/server";
import OpenAI from "openai";
import { PDFParse } from "pdf-parse";

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return new OpenAI({ apiKey });
}

async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function extractTextFromPdf(file: File): Promise<string> {
  const buffer = await fileToBuffer(file);
  const parser = new PDFParse({ data: buffer });

  try {
    const data = await parser.getText();
    return data.text || "";
  } finally {
    await parser.destroy();
  }
}

function parseModelJson(content: string | null): Record<string, unknown> {
  if (!content) {
    throw new Error("Model returned an empty response.");
  }

  try {
    return JSON.parse(content);
  } catch {
    throw new Error("Model returned invalid JSON.");
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

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const text = formData.get("text");
    const file = formData.get("file");

    if (typeof text === "string" && text.trim()) {
      const result = await analyzeText(text.trim());
      return NextResponse.json(result);
    }

    if (file instanceof File) {
      if (file.type.startsWith("image/")) {
        const result = await analyzeImage(file);
        return NextResponse.json(result);
      }

      if (file.type === "application/pdf") {
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

    if (error instanceof Error && error.message === "OPENAI_API_KEY is not configured.") {
      return NextResponse.json(
        {
          error:
            "Missing OPENAI_API_KEY server environment variable. Add it to your .env.local file and restart the dev server.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong while processing the content." },
      { status: 500 }
    );
  }
}
