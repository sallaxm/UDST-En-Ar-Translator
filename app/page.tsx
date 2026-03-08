"use client";

import { useState } from "react";

export default function Dashboard() {
  const [input, setInput] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-white flex">
      <aside className="hidden md:flex w-64 border-r border-white/10 backdrop-blur-xl bg-white/5 p-6 flex-col gap-6">
        <h1 className="text-xl font-semibold tracking-tight">Lecture AI</h1>

        <nav className="flex flex-col gap-2 text-sm">
          <button className="text-left px-4 py-2 rounded-xl bg-white/10">
            Translator
          </button>
          <button className="text-left px-4 py-2 rounded-xl hover:bg-white/10 transition">
            CV Builder
          </button>
          <button className="text-left px-4 py-2 rounded-xl hover:bg-white/10 transition">
            History
          </button>
          <button className="text-left px-4 py-2 rounded-xl hover:bg-white/10 transition">
            Settings
          </button>
        </nav>

        <div className="mt-auto text-xs text-white/40">v0.1</div>
      </aside>

      <main className="flex-1 p-4 md:p-10">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">
              Lecture Translator
            </h2>
            <p className="text-white/50 mt-1">
              Paste text or upload an image to get explanation and translation.
            </p>
          </div>

          <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 space-y-4 shadow-2xl">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste lecture text here..."
              className="w-full h-40 bg-transparent border border-white/10 rounded-2xl p-4 outline-none focus:border-white/30 resize-none"
            />

            <div className="flex flex-wrap gap-3">
              <button className="px-5 py-2 rounded-xl bg-white text-black font-medium hover:opacity-90 transition">
                Explain
              </button>

              <button className="px-5 py-2 rounded-xl border border-white/20 hover:bg-white/10 transition">
                Upload Image
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 shadow-xl">
              <h3 className="text-lg font-semibold mb-3">Simple English</h3>
              <p className="text-white/70 text-sm">
                Your simplified explanation will appear here.
              </p>
            </div>

            <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 shadow-xl">
              <h3 className="text-lg font-semibold mb-3">Arabic Explanation</h3>
              <p className="text-white/70 text-sm">سيظهر الشرح هنا.</p>
            </div>

            <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 shadow-xl">
              <h3 className="text-lg font-semibold mb-3">Arabic Translation</h3>
              <p className="text-white/70 text-sm">ستظهر الترجمة هنا.</p>
            </div>

            <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 shadow-xl">
              <h3 className="text-lg font-semibold mb-3">Keywords</h3>

              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-white/10 text-xs">
                  Fiscal Policy
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-xs">
                  Aggregate Demand
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}