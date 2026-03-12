"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type AccountResponse = {
  email: string;
  hasAccount: boolean;
  subscription: {
    isActive: boolean;
    endsAt: string | null;
  };
};

function formatRemainingTime(endsAt: string | null) {
  if (!endsAt) return "No active subscription";

  const end = new Date(endsAt).getTime();
  const diff = end - Date.now();

  if (diff <= 0) return "Expired";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return `${days} day(s), ${hours} hour(s) left`;
}

export default function AccountPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<AccountResponse | null>(null);

  const reload = async () => {
    const res = await fetch("/api/account/me", { cache: "no-store" });
    const payload = (await res.json()) as AccountResponse;
    setData(payload);
    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;

    fetch("/api/account/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((payload: AccountResponse) => {
        if (!isMounted) return;
        setData(payload);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const remaining = useMemo(() => formatRemainingTime(data?.subscription.endsAt || null), [data]);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/account/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error || "Could not save your account email.");
      setSaving(false);
      return;
    }

    setEmail("");
    await reload();
    setSaving(false);
  };

  const handleLogout = async () => {
    setSaving(true);
    setError("");
    await fetch("/api/account/session", { method: "DELETE" });
    await reload();
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_28%),linear-gradient(180deg,_#050816_0%,_#0a1020_45%,_#0d1528_100%)] text-white">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/80 transition hover:bg-white/[0.08]">← Back</Link>
          <div className="flex gap-2">
            <Link href="/pricing" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/85 transition hover:bg-white/[0.08]">Pricing</Link>
            <Link href="/refund-policy" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/85 transition hover:bg-white/[0.08]">Refund Policy</Link>
          </div>
        </div>

        <h1 className="mb-4 text-3xl font-semibold tracking-tight">Account</h1>
        <p className="mb-8 text-white/70">Use your email to create/sign in to your account so we can attach your Paddle subscription to you.</p>

        <div className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
            <h2 className="mb-3 text-xl font-semibold">Account details</h2>
            {loading ? (
              <p className="text-white/70">Loading...</p>
            ) : data?.hasAccount ? (
              <div className="space-y-2 text-white/80">
                <p><span className="text-white/60">Email:</span> {data.email}</p>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={saving}
                  className="mt-3 rounded-xl border border-red-300/30 bg-red-400/10 px-3 py-1.5 text-sm text-red-100 hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-3">
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-2.5 text-white outline-none placeholder:text-white/35 focus:border-blue-300/45"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl border border-blue-300/35 bg-blue-400/20 px-4 py-2 text-sm font-medium text-blue-100 hover:bg-blue-400/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Create / Sign in account"}
                </button>
              </form>
            )}
            {error && <p className="mt-3 text-sm text-red-200">{error}</p>}
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
            <h2 className="mb-3 text-xl font-semibold">Subscription</h2>
            <p className="text-white/80">
              <span className="text-white/60">Status:</span> {data?.subscription.isActive ? "Active" : "Inactive"}
            </p>
            <p className="text-white/80">
              <span className="text-white/60">Time remaining:</span> {remaining}
            </p>
            <p className="mt-3 text-sm text-white/60">
              After Paddle payment, your backend webhook should set the
              <code className="mx-1 rounded bg-white/10 px-1.5 py-0.5">translator_subscription_ends_at</code>
              cookie or persist this value in your database.
            </p>
            <Link href="/pricing" className="mt-4 inline-flex rounded-xl border border-blue-300/35 bg-blue-400/20 px-3 py-1.5 text-sm text-blue-100 hover:bg-blue-400/30">View pricing</Link>
          </section>
        </div>
      </div>
    </div>
  );
}
