import Link from "next/link";

type Props = {
  searchParams: Promise<{ lang?: string }>;
};

const SUBSCRIPTION_PRICE_USD = 14;
const SUBSCRIPTION_TERM_MONTHS = 4;

const text = {
  en: {
    back: "← Back",
    account: "Account",
    refund: "Refund Policy",
    toggle: "العربية",
    title: "Pricing",
    subtitle: "Start with 5 free translations per day. Upgrade for unlimited usage.",
    plan: "Pro subscription",
    every: `every ${SUBSCRIPTION_TERM_MONTHS} months`,
    points: [
      "Unlimited translations after free tier is used.",
      "Account-linked subscription for reliable access.",
      "Managed securely via Paddle.",
    ],
    checkout: "Continue to Paddle checkout",
    missingPrefix: "Paddle checkout is not configured yet. Add",
    missingSuffix: "in your environment.",
  },
  ar: {
    back: "→ رجوع",
    account: "الحساب",
    refund: "سياسة الاسترجاع",
    toggle: "English",
    title: "الأسعار",
    subtitle: "ابدأ بـ 5 ترجمات مجانية يوميًا. ثم قم بالترقية لاستخدام غير محدود.",
    plan: "اشتراك برو",
    every: `كل ${SUBSCRIPTION_TERM_MONTHS} أشهر`,
    points: [
      "ترجمات غير محدودة بعد انتهاء الحد المجاني اليومي.",
      "اشتراك مرتبط بالحساب للوصول بشكل موثوق.",
      "إدارة دفع آمنة عبر Paddle.",
    ],
    checkout: "الانتقال إلى الدفع عبر Paddle",
    missingPrefix: "لم يتم إعداد رابط الدفع عبر Paddle بعد. أضف",
    missingSuffix: "في متغيرات البيئة.",
  },
} as const;

export default async function PricingPage({ searchParams }: Props) {
  const params = await searchParams;
  const language = params.lang === "en" ? "en" : "ar";
  const t = text[language];
  const toggleLang = language === "en" ? "ar" : "en";

  const checkoutUrl = process.env.PADDLE_CHECKOUT_URL || "";

  return (
    <div
      dir={language === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_30%),linear-gradient(180deg,_#040812_0%,_#091122_52%,_#0c1630_100%)] text-white"
    >
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between gap-3">
          <Link href={`/?lang=${language}`} className="inline-flex rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/80 transition hover:bg-white/[0.08]">{t.back}</Link>
          <div className="flex gap-2">
            <Link href={`/account?lang=${language}`} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/85 transition hover:bg-white/[0.08]">{t.account}</Link>
            <Link href={`/refund-policy?lang=${language}`} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/85 transition hover:bg-white/[0.08]">{t.refund}</Link>
            <Link href={`/pricing?lang=${toggleLang}`} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/85 transition hover:bg-white/[0.08]">{t.toggle}</Link>
          </div>
        </div>

        <h1 className="mb-3 text-3xl font-semibold tracking-tight">{t.title}</h1>
        <p className="mb-8 text-white/70">{t.subtitle}</p>

        <section className="rounded-3xl border border-blue-200/20 bg-blue-500/10 p-7 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <p className="text-sm uppercase tracking-widest text-blue-100/70">{t.plan}</p>
          <p className="mt-3 text-4xl font-semibold">${SUBSCRIPTION_PRICE_USD}</p>
          <p className="mt-1 text-white/70">{t.every}</p>

          <ul className="mt-6 list-disc space-y-2 ps-5 text-white/80">
            {t.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>

          {checkoutUrl ? (
            <a href={checkoutUrl} target="_blank" rel="noreferrer" className="mt-7 inline-flex rounded-2xl border border-blue-300/35 bg-blue-400/30 px-4 py-2 text-sm font-medium text-blue-50 hover:bg-blue-400/45">{t.checkout}</a>
          ) : (
            <p className="mt-7 rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
              {t.missingPrefix}
              <code className="mx-1 rounded bg-white/10 px-1.5 py-0.5">PADDLE_CHECKOUT_URL</code>
              {t.missingSuffix}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
