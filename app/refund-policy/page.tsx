import Link from "next/link";

type Props = {
  searchParams: Promise<{ lang?: string }>;
};

const text = {
  en: {
    back: "← Back",
    pricing: "Pricing",
    toggle: "العربية",
    title: "Refund Policy",
    points: [
      "We offer refunds for accidental duplicate purchases and technical issues that prevent subscription access.",
      "To request a refund, contact support within 7 days of the charge and include your payment email and transaction details.",
      "If your refund is approved, it is processed through Paddle and may take several business days to appear depending on your bank.",
      "This policy is a template. Please update it to match your legal and regional requirements before going live.",
    ],
  },
  ar: {
    back: "→ رجوع",
    pricing: "الأسعار",
    toggle: "English",
    title: "سياسة الاسترجاع",
    points: [
      "نقدّم استرجاعًا في حالات الشراء المكرر بالخطأ أو المشكلات التقنية التي تمنع الوصول للاشتراك.",
      "لطلب الاسترجاع، تواصل مع الدعم خلال 7 أيام من تاريخ الدفع مع إرفاق بريد الدفع وتفاصيل العملية.",
      "إذا تمت الموافقة على الاسترجاع، يتم عبر Paddle وقد يستغرق عدة أيام عمل حسب البنك.",
      "هذه السياسة قالب مبدئي. يرجى تحديثها بما يتوافق مع المتطلبات القانونية في بلدك قبل الإطلاق.",
    ],
  },
} as const;

export default async function RefundPolicyPage({ searchParams }: Props) {
  const params = await searchParams;
  const language = params.lang === "en" ? "en" : "ar";
  const t = text[language];
  const toggleLang = language === "en" ? "ar" : "en";

  return (
    <div
      dir={language === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_30%),linear-gradient(180deg,_#040812_0%,_#091122_52%,_#0c1630_100%)] text-white"
    >
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between gap-3">
          <Link href={`/?lang=${language}`} className="inline-flex rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/80 transition hover:bg-white/[0.08]">{t.back}</Link>
          <div className="flex gap-2">
            <Link href={`/pricing?lang=${language}`} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/85 transition hover:bg-white/[0.08]">{t.pricing}</Link>
            <Link href={`/refund-policy?lang=${toggleLang}`} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/85 transition hover:bg-white/[0.08]">{t.toggle}</Link>
          </div>
        </div>

        <h1 className="mb-6 text-3xl font-semibold tracking-tight">{t.title}</h1>

        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-white/80 backdrop-blur-xl">
          {t.points.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
