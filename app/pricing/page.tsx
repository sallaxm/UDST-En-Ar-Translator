import Link from "next/link";

const SUBSCRIPTION_PRICE_USD = 14;
const SUBSCRIPTION_TERM_MONTHS = 4;

export default function PricingPage() {
  const checkoutUrl = process.env.PADDLE_CHECKOUT_URL || "";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_30%),linear-gradient(180deg,_#040812_0%,_#091122_52%,_#0c1630_100%)] text-white">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/80 transition hover:bg-white/[0.08]">← Back</Link>
          <div className="flex gap-2">
            <Link href="/account" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/85 transition hover:bg-white/[0.08]">Account</Link>
            <Link href="/refund-policy" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/85 transition hover:bg-white/[0.08]">Refund Policy</Link>
          </div>
        </div>

        <h1 className="mb-3 text-3xl font-semibold tracking-tight">Pricing</h1>
        <p className="mb-8 text-white/70">Start with 5 free translations per day. Upgrade for unlimited usage.</p>

        <section className="rounded-3xl border border-blue-200/20 bg-blue-500/10 p-7 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <p className="text-sm uppercase tracking-widest text-blue-100/70">Pro subscription</p>
          <p className="mt-3 text-4xl font-semibold">${SUBSCRIPTION_PRICE_USD}</p>
          <p className="mt-1 text-white/70">every {SUBSCRIPTION_TERM_MONTHS} months</p>

          <ul className="mt-6 list-disc space-y-2 ps-5 text-white/80">
            <li>Unlimited translations after free tier is used.</li>
            <li>Account-linked subscription for reliable access.</li>
            <li>Managed securely via Paddle.</li>
          </ul>

          {checkoutUrl ? (
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-7 inline-flex rounded-2xl border border-blue-300/35 bg-blue-400/30 px-4 py-2 text-sm font-medium text-blue-50 hover:bg-blue-400/45"
            >
              Continue to Paddle checkout
            </a>
          ) : (
            <p className="mt-7 rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
              Paddle checkout is not configured yet. Add
              <code className="mx-1 rounded bg-white/10 px-1.5 py-0.5">PADDLE_CHECKOUT_URL</code>
              in your environment.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
