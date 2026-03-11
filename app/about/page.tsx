"use client";

import Link from "next/link";
import { useState } from "react";

type UiLanguage = "en" | "ar";

const aboutText = {
  en: {
    back: "← Back",
    languageToggle: "العربية",
    title: "About",
    howItWorksTitle: "How it works",
    howItWorksBody:
      "Upload a phone photo, screenshot, or PDF of your lecture material. You can also paste text directly. The system automatically generates:",
    howItWorksList: [
      "Simple English explanation",
      "Arabic explanation",
      "Arabic translation",
      "Key academic terms with Arabic meaning",
    ],
    privacyTitle: "Privacy",
    privacyBody:
      "Uploaded files and pasted text are processed only to generate explanations and translations. This tool does not intentionally store lecture materials or personal information.",
    privacyNote: "Do not upload sensitive or personal data.",
    termsTitle: "Terms and Conditions",
    termsList: [
      'This tool is provided on an "as is" basis for educational support and may produce incorrect, incomplete, or outdated results.',
      "You are responsible for reviewing all generated content before using it in study, assignments, or communication.",
      "Do not upload confidential, personal, or legally restricted documents.",
      "By using this app, you agree that the maintainers are not liable for decisions made based on generated outputs.",
    ],
    independenceTitle: "Independence",
    independenceBody:
      "This project is an independent tool created to help students understand English lecture material more easily.",
    independenceNote:
      "It is not affiliated with, endorsed by, or operated by any university or educational institution.",
  },
  ar: {
    back: "→ رجوع",
    languageToggle: "English",
    title: "عن الموقع",
    howItWorksTitle: "كيف يعمل",
    howItWorksBody:
      "ارفع صورة من الهاتف أو لقطة شاشة أو ملف PDF من مادة المحاضرة. ويمكنك أيضًا لصق النص مباشرة. سيقوم النظام تلقائيًا بإنشاء:",
    howItWorksList: [
      "شرح مبسط باللغة الإنجليزية",
      "شرح باللغة العربية",
      "ترجمة عربية مباشرة",
      "مصطلحات أكاديمية أساسية مع معناها بالعربية",
    ],
    privacyTitle: "الخصوصية",
    privacyBody:
      "تتم معالجة الملفات المرفوعة والنصوص الملصقة فقط لإنتاج الشرح والترجمة. لا يقوم هذا الموقع بتخزين مواد المحاضرات أو المعلومات الشخصية بشكل مقصود.",
    privacyNote: "يرجى عدم رفع بيانات حساسة أو شخصية.",
    termsTitle: "الشروط والأحكام",
    termsList: [
      "هذه الأداة مقدّمة كما هي لأغراض تعليمية، وقد تنتج نتائج غير دقيقة أو غير مكتملة أو قديمة.",
      "أنت مسؤول عن مراجعة جميع النتائج قبل استخدامها في الدراسة أو الواجبات أو المراسلات.",
      "يرجى عدم رفع مستندات سرية أو شخصية أو مقيدة قانونيًا.",
      "باستخدامك للتطبيق، فإنك توافق على أن القائمين عليه غير مسؤولين عن القرارات المعتمدة على النتائج المولدة.",
    ],
    independenceTitle: "الاستقلالية",
    independenceBody:
      "هذا المشروع أداة مستقلة تم إنشاؤها لمساعدة الطلاب على فهم مواد المحاضرات الإنجليزية بشكل أسهل.",
    independenceNote:
      "هذا الموقع غير تابع لأي جامعة أو جهة تعليمية، وغير معتمد أو مُدار من قبلها.",
  },
} as const;

export default function AboutPage() {
  const [language, setLanguage] = useState<UiLanguage>("ar");
  const t = aboutText[language];

  return (
    <div
      dir={language === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_28%),linear-gradient(180deg,_#050816_0%,_#0a1020_45%,_#0d1528_100%)] text-white"
    >
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/80 transition hover:bg-white/[0.08]"
          >
            {t.back}
          </Link>

          <button
            type="button"
            onClick={() => setLanguage((prev) => (prev === "en" ? "ar" : "en"))}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/85 transition hover:bg-white/[0.08]"
          >
            {t.languageToggle}
          </button>
        </div>

        <h1 className="mb-8 text-3xl font-semibold tracking-tight">{t.title}</h1>

        <div className="space-y-6 text-white/80">
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
            <h2 className="mb-3 text-xl font-semibold">{t.howItWorksTitle}</h2>
            <p className="leading-7 text-white/75">{t.howItWorksBody}</p>

            <ul className="mt-3 list-disc space-y-1 ps-5 text-white/70">
              {t.howItWorksList.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
            <h2 className="mb-3 text-xl font-semibold">{t.privacyTitle}</h2>

            <p className="leading-7 text-white/75">{t.privacyBody}</p>

            <p className="mt-3 leading-7 text-white/70">{t.privacyNote}</p>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
            <h2 className="mb-3 text-xl font-semibold">{t.termsTitle}</h2>

            <ul className="list-disc space-y-2 ps-5 text-white/75">
              {t.termsList.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
            <h2 className="mb-3 text-xl font-semibold">{t.independenceTitle}</h2>

            <p className="leading-7 text-white/75">{t.independenceBody}</p>

            <p className="mt-3 leading-7 text-white/70">{t.independenceNote}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
