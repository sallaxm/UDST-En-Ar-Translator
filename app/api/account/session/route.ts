import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim().toLowerCase() || "";

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set("translator_account_email", email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({ ok: true, email });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("translator_account_email");

  return NextResponse.json({ ok: true });
}
