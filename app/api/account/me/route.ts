import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function parseSubscriptionEnd(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export async function GET() {
  const cookieStore = await cookies();
  const email = cookieStore.get("translator_account_email")?.value || "";
  const subscriptionEndRaw = cookieStore.get("translator_subscription_ends_at")?.value;
  const subscriptionEnd = parseSubscriptionEnd(subscriptionEndRaw);

  const now = Date.now();
  const isActive = Boolean(subscriptionEnd && subscriptionEnd.getTime() > now);

  return NextResponse.json({
    email,
    hasAccount: Boolean(email),
    subscription: {
      isActive,
      endsAt: subscriptionEnd ? subscriptionEnd.toISOString() : null,
    },
  });
}
