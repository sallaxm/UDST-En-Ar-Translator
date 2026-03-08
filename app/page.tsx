"use client";

import { useState } from "react";

export default function Dashboard() {
  const [input, setInput] = useState("");

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(122,28,45,0.22),_transparent_28%),linear-gradient(135deg,_#09090b_0%,_#111113_45%,_#1a0f14_100%)] text-white flex">
      <aside className="hidden md:flex w-64 border-r border-white/10 bg-white/5 backdrop-blur-2xl p-6 flex-col gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center rounded-full border border-[#7a1c2d]/40 bg-[#7a1c2d]/15 px-3 py-1 text-[11px] font-medium text-[#f0c7d0]">
            UDST Notes
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Translator</h1>
          <p className="text-sm text-white/45">English to Arabic lecture support</p>
        </div>

        <nav className="flex flex-col gap-2 text-sm">
          <button className="text-left px-4 py-2.5 rounded-2xl bg-[#7a1c2d]/25 border border-[#7a1c2d]/30 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            Translator
          </button>
          <button className="text-left px-4 py-2.5 rounded-2xl hover:bg-white/10 transition text-white/70">
            History
          </button>
          <button className="text-left px-4 py-2.5 rounded-2xl hover:bg-white/10 transition text-white/70">
            Settings
          </button>
        </nav>

        <div className="mt-auto rounded-2xl border border-white/10 bg-gradient-to-br from-white/8 to-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-white/35">Version</p>
          <p className="mt-1 text-sm text-white/70">v0.1</p>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 lg:p-10">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center rounded-full border border-[#7a1c2d]/35 bg-[#7a1c2d]/15 px-3 py-1 text-xs font-medium text-[#f0c7d0]">
                Modern UDST-style dashboard
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Lecture Translator</h2>
              <p className="mt-2 max-w-2xl text-sm md:text-base text-white/50">
                Paste lecture text or upload an image to get simple English, Arabic explanation, Arabic translation, and translated keywords.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-6 md:p-7 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Input</h3>
                <p className="text-sm text-white/45">Paste notes, lecture slides, or assignment text</p>
              </div>
              <div className="hidden md:block h-10 w-10 rounded-2xl bg-gradient-to-br from-[#7a1c2d]/35 to-white/5 border border-white/10" />
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste lecture text here..."
              className="w-full h-44 resize-none rounded-3xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-[#7a1c2d]/60 focus:bg-black/25"
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <button className="rounded-2xl bg-gradient-to-r from-[#7a1c2d] to-[#9d2f47] px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#7a1c2d]/20 transition hover:opacity-95">
                Explain
              </button>
              <button className="rounded-2xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/85 transition hover:bg-white/10">
                Upload Image
              </button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#7a1c2d]/30 to-white/5 border border-white/10" />
                <div>
                  <h3 className="text-lg font-semibold">Simple English</h3>
                  <p className="text-sm text-white/45">Clear, easier wording</p>
                </div>
              </div>
              <p className="text-sm leading-7 text-white/72">
                Your simplified explanation will appear here.
              </p>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#7a1c2d]/30 to-white/5 border border-white/10" />
                <div>
                  <h3 className="text-lg font-semibold">Arabic Explanation</h3>
                  <p className="text-sm text-white/45">شرح مبسط بالعربية</p>
                </div>
              </div>
              <p dir="ltr" className="text-left text-sm leading-7 text-white/72">
                سيظهر الشرح هنا بطريقة واضحة ومبسطة.
              </p>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#7a1c2d]/30 to-white/5 border border-white/10" />
                <div>
                  <h3 className="text-lg font-semibold">Arabic Translation</h3>
                  <p className="text-sm text-white/45">ترجمة مباشرة للنص</p>
                </div>
              </div>
              <p dir="ltr" className="text-left text-sm leading-7 text-white/72">
                ستظهر الترجمة هنا.
              </p>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#7a1c2d]/30 to-white/5 border border-white/10" />
                <div>
                  <h3 className="text-lg font-semibold">Keywords</h3>
                  <p className="text-sm text-white/45">Main terms with Arabic meaning</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-[#7a1c2d]/35 bg-[#7a1c2d]/15 px-3 py-1.5 text-xs text-[#f5d8de]">
                  Fiscal Policy — السياسة المالية
                </span>
                <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs text-white/80">
                  Aggregate Demand — الطلب الكلي
                </span>
                <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs text-white/80">
                  Taxation — الضرائب
                </span>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
