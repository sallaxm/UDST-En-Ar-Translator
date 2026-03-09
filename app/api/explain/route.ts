import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

function getModel() {
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in .env.local");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  return genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });
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

    throw new Error("Model response was not valid JSON");
  }
}

async function analyzeText(text: string) {
  const model = getModel();
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

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const textOutput = response.text();

  return parseModelJson(textOutput);
}

async function analyzeImage(file: File) {
  const model = getModel();
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

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: file.type,
        data: base64,
      },
    },
  ]);

  const response = await result.response;
  const textOutput = response.text();

  return parseModelJson(textOutput);
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

      return NextResponse.json(
        { error: "Only images supported for now." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "No text or file provided." },
      { status: 400 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to process request." },
      { status: 500 }
    );
  }
}
