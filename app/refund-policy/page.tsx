import Link from "next/link";

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_30%),linear-gradient(180deg,_#040812_0%,_#091122_52%,_#0c1630_100%)] text-white">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/80 transition hover:bg-white/[0.08]">← Back</Link>
          <Link href="/pricing" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/85 transition hover:bg-white/[0.08]">Pricing</Link>
        </div>

        <h1 className="mb-6 text-3xl font-semibold tracking-tight">Refund Policy</h1>

        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-white/80 backdrop-blur-xl">
          <p>
            We offer refunds for accidental duplicate purchases and technical issues that prevent subscription access.
          </p>
          <p>
            To request a refund, contact support within 7 days of the charge and include your payment email and transaction details.
          </p>
          <p>
            If your refund is approved, it is processed through Paddle and may take several business days to appear depending on your bank.
          </p>
          <p>
            This policy is a template. Please update it to match your legal and regional requirements before going live.
          </p>
        </div>
      </div>
    </div>
  );
}
