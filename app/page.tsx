"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";

type Keyword = {
  en: string;
  ar: string;
};

type ResultData = {
  simple: string;
  arabicExplanation: string;
  arabicTranslation: string;
  keywords: Keyword[];
};

const emptyResult: ResultData = {
  simple: "",
  arabicExplanation: "",
  arabicTranslation: "",
  keywords: [],
};

export default function Dashboard() {
  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [selectedFileType, setSelectedFileType] = useState<
    "image" | "pdf" | "powerpoint" | ""
  >("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResultData>(emptyResult);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const processText = async (textValue: string) => {
    if (!textValue.trim()) return;

    setIsProcessing(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("text", textValue);

      const res = await fetch("/api/explain", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process text.");
      }

      setResult({
        simple: data.simple || "",
        arabicExplanation: data.arabicExplanation || "",
        arabicTranslation: data.arabicTranslation || "",
        keywords: Array.isArray(data.keywords) ? data.keywords : [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process text.");
    } finally {
      setIsProcessing(false);
    }
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/explain", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process file.");
      }

      setResult({
        simple: data.simple || "",
        arabicExplanation: data.arabicExplanation || "",
        arabicTranslation: data.arabicTranslation || "",
        keywords: Array.isArray(data.keywords) ? data.keywords : [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setSelectedFileName(file.name);
    setInput("");
    setError("");

    if (file.type.startsWith("image/")) {
      setSelectedFileType("image");
    } else if (file.type === "application/pdf") {
      setSelectedFileType("pdf");
    } else {
      setSelectedFileType("powerpoint");
    }

    void processFile(file);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const openCameraPicker = () => {
    cameraInputRef.current?.click();
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setSelectedFileName("");
    setSelectedFileType("");
    setError("");
    setResult(emptyResult);

    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  useEffect(() => {
    if (selectedFile) return;

    if (!input.trim()) {
      setResult(emptyResult);
      setError("");
      return;
    }

    if (textTimeoutRef.current) {
      clearTimeout(textTimeoutRef.current);
    }

    textTimeoutRef.current = setTimeout(() => {
      void processText(input);
    }, 900);

    return () => {
      if (textTimeoutRef.current) {
        clearTimeout(textTimeoutRef.current);
      }
    };
  }, [input, selectedFile]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,94,184,0.18),_transparent_30%),linear-gradient(180deg,_#060914_0%,_#0b1020_45%,_#0f172a_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col md:flex-row">
        <aside className="sticky top-0 z-20 border-b border-white/10 bg-[#0b1020]/80 backdrop-blur-2xl md:h-screen md:w-72 md:border-b-0 md:border-r">
          <div className="px-4 py-4 md:p-6">
            <div className="space-y-1">
              <div className="inline-flex items-center rounded-full border border-[#005EB8]/40 bg-[#005EB8]/15 px-3 py-1 text-[11px] font-medium text-[#9fd0ff]">
                UDST Notes
              </div>
              <h1 className="mt-2 text-lg font-semibold tracking-tight md:text-xl">
                Translator
              </h1>
              <p className="text-xs text-white/45 md:text-sm">
                English to Arabic lecture support
              </p>
            </div>
          </div>

          <nav className="flex gap-2 overflow-x-auto px-4 pb-4 text-sm [&::-webkit-scrollbar]:hidden md:flex-col md:px-6 md:pb-0">
            <button className="shrink-0 rounded-2xl border border-[#005EB8]/30 bg-[#005EB8]/20 px-4 py-2.5 text-left text-white shadow-[0_8px_30px_rgba(0,94,184,0.15)]">
              Translator
            </button>
            <a
              href="/about"
              className="shrink-0 rounded-2xl px-4 py-2.5 text-left text-white/65 transition hover:bg-white/10 hover:text-white"
            >
              About
            </a>
          </nav>
        </aside>

        <main className="flex-1 p-3 pb-8 sm:p-4 md:p-8 lg:p-10">
          <div className="mx-auto max-w-5xl space-y-4 md:space-y-6">
            <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl md:p-7">
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="mb-3 inline-flex items-center rounded-full border border-[#005EB8]/35 bg-[#005EB8]/15 px-3 py-1 text-[11px] font-medium text-[#9fd0ff] md:text-xs">
                    Auto-processing mobile-first dashboard
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight md:text-4xl">
                    Lecture Translator
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55 md:text-base">
                    Optimized for phone photos, screenshots, PDFs, and
                    PowerPoints. Upload or paste and it starts automatically.
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-3 sm:p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-white md:text-base">
                      Input
                    </h3>
                    <p className="text-xs text-white/40 md:text-sm">
                      Paste notes, upload a document, or take a photo
                    </p>
                  </div>

                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/60">
                    {isProcessing ? "Processing..." : "Ready"}
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={openCameraPicker}
                    className="rounded-2xl border border-[#005EB8]/25 bg-[#005EB8]/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-[#005EB8]/20"
                  >
                    Take Photo
                  </button>

                  <button
                    type="button"
                    onClick={openFilePicker}
                    className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white/90 transition hover:bg-white/10"
                  >
                    Upload File
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.ppt,.pptx,image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {selectedFileName && (
                  <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {selectedFileName}
                      </p>
                      <p className="mt-1 text-xs text-white/45 capitalize">
                        {selectedFileType === "image" && "Image uploaded"}
                        {selectedFileType === "pdf" && "PDF uploaded"}
                        {selectedFileType === "powerpoint" &&
                          "PowerPoint uploaded"}
                        {isProcessing && " • processing automatically"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={clearSelectedFile}
                      className="ml-3 shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
                    >
                      Clear
                    </button>
                  </div>
                )}

                <textarea
                  value={input}
                  onChange={(e) => {
                    setSelectedFile(null);
                    setSelectedFileName("");
                    setSelectedFileType("");
                    setInput(e.target.value);
                  }}
                  placeholder="Paste lecture text here and it will process automatically..."
                  className="h-40 w-full resize-none rounded-3xl border border-white/10 bg-[#0b1020]/80 px-4 py-4 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-[#2F80ED]/60 focus:bg-[#0b1020] md:h-48"
                />

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/65">
                    Phone photos
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/65">
                    Screenshots
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/65">
                    PDFs
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/65">
                    PowerPoints
                  </span>
                </div>

                {error && (
                  <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </div>
                )}
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 md:gap-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl md:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold md:text-lg">
                      Simple English
                    </h3>
                    <p className="text-xs text-white/45 md:text-sm">
                      Clear, easier wording
                    </p>
                  </div>
                  {isProcessing && (
                    <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#2F80ED]" />
                  )}
                </div>
                <p className="whitespace-pre-wrap text-sm leading-7 text-white/75">
                  {result.simple ||
                    "Your simplified explanation will appear here automatically."}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl md:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold md:text-lg">
                      Arabic Explanation
                    </h3>
                    <p className="text-xs text-white/45 md:text-sm">
                      شرح مبسط بالعربية
                    </p>
                  </div>
                  {isProcessing && (
                    <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#2F80ED]" />
                  )}
                </div>
                <p
                  dir="ltr"
                  className="whitespace-pre-wrap text-left text-sm leading-7 text-white/75"
                >
                  {result.arabicExplanation ||
                    "سيظهر الشرح هنا تلقائيًا بعد رفع الصورة أو الملف أو لصق النص."}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl md:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold md:text-lg">
                      Arabic Translation
                    </h3>
                    <p className="text-xs text-white/45 md:text-sm">
                      ترجمة مباشرة للنص
                    </p>
                  </div>
                  {isProcessing && (
                    <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#2F80ED]" />
                  )}
                </div>
                <p
                  dir="ltr"
                  className="whitespace-pre-wrap text-left text-sm leading-7 text-white/75"
                >
                  {result.arabicTranslation || "ستظهر الترجمة هنا تلقائيًا."}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl md:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold md:text-lg">
                      Keywords
                    </h3>
                    <p className="text-xs text-white/45 md:text-sm">
                      Main terms with Arabic meaning
                    </p>
                  </div>
                  {isProcessing && (
                    <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#2F80ED]" />
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {result.keywords.length > 0 ? (
                    result.keywords.map((keyword, index) => (
                      <span
                        key={`${keyword.en}-${index}`}
                        className="rounded-full border border-[#005EB8]/35 bg-[#005EB8]/15 px-3 py-1.5 text-xs text-[#cde7ff]"
                      >
                        {keyword.en} — {keyword.ar}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/65">
                      Keywords will appear automatically
                    </span>
                  )}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}