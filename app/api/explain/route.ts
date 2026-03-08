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
            "You help university students understand lectures. Always respond in this format: Simple English, Arabic Explanation, Arabic Translation, Keywords.",
        },
        {
          role: "user",
          content: `Analyze this lecture text and return:

1. Simple English explanation
2. Arabic explanation
3. Direct Arabic translation
4. 5 important keywords with Arabic translation

Text:
${text}`,
        },
      ],
    }),
  });

  const data = await response.json();

  return NextResponse.json({
    result: data.choices[0].message.content,
  });
}