import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { text } = await req.json();

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Return JSON with keys: simple, arabicExplanation, arabicTranslation, keywords (array of {en, ar}).",
        },
        {
          role: "user",
          content: `Explain this lecture text:\n\n${text}`,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  const data = await response.json();
  const content = JSON.parse(data.choices[0].message.content);

  return NextResponse.json(content);
}