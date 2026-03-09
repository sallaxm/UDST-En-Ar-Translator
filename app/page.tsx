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

async function parseApiResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = (await res.json()) as T & { error?: string };

    if (!res.ok) {
      throw new Error(data.error || "Request failed.");
    }

    return data;
  }

  const bodyText = (await res.text()).trim();

  if (res.status === 413) {
    throw new Error("The uploaded file is too large. Please try a smaller PDF.");
  }

  if (res.status === 429) {
    throw new Error("Too many requests. Please wait a moment and try again.");
  }

  throw new Error(
    bodyText
      ? `Server error (${res.status}). Please try again. ${bodyText.slice(0, 120)}`
      : `Server error (${res.status}). Please try again.`
  );
}

const emptyResult: ResultData = {
  simple: "",
  arabicExplanation: "",
  arabicTranslation: "",
  keywords: [],
};

function LoadingLines({ arabic = false }: { arabic?: boolean }) {
  return (
    <div className={`space-y-3 ${arabic ? "text-left" : ""}`}>
      <div className="h-4 w-full animate-pulse rounded-full bg-white/8" />
      <div className="h-4 w-11/12 animate-pulse rounded-full bg-white/8" />
      <div className="h-4 w-10/12 animate-pulse rounded-full bg-white/8" />
      <div className="h-4 w-8/12 animate-pulse rounded-full bg-white/8" />
    </div>
  );
}

export default function Dashboard() {
  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [selectedFileType, setSelectedFileType] = useState<
    "image" | "pdf" | "word" | "powerpoint" | ""
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

      const data = await parseApiResponse<ResultData>(res);

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

      const data = await parseApiResponse<ResultData>(res);

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
    setResult(emptyResult);

    const lowerName = file.name.toLowerCase();

    if (file.type.startsWith("image/")) {
      setSelectedFileType("image");
    } else if (file.type === "application/pdf" || lowerName.endsWith(".pdf")) {
      setSelectedFileType("pdf");
    } else if (
      file.type.includes("word") ||
      file.type.includes("officedocument.wordprocessingml") ||
      lowerName.endsWith(".doc") ||
      lowerName.endsWith(".docx")
    ) {
      setSelectedFileType("word");
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

  const hasResult =
    result.simple ||
    result.arabicExplanation ||
    result.arabicTranslation ||
    result.keywords.length > 0;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.10),_transparent_24%),linear-gradient(180deg,_#050816_0%,_#0a1020_45%,_#0d1528_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col md:flex-row">
        <aside className="sticky top-0 z-20 border-b border-white/8 bg-[#09101f]/80 backdrop-blur-2xl md:h-screen md:w-64 md:border-b-0 md:border-r">
          <div className="px-4 py-4 md:p-6">
            <h1 className="text-lg font-semibold tracking-tight md:text-xl">
              Translator
            </h1>
            <p className="mt-1 text-sm text-white/40">
              English to Arabic support
            </p>
          </div>

          <nav className="flex gap-2 overflow-x-auto px-4 pb-4 text-sm [&::-webkit-scrollbar]:hidden md:flex-col md:px-6 md:pb-0">
            <button className="shrink-0 rounded-2xl border border-[#3b82f6]/25 bg-[#3b82f6]/12 px-4 py-2.5 text-left text-white shadow-[0_10px_30px_rgba(59,130,246,0.10)]">
              Translator
            </button>
            <a
              href="/about"
              className="shrink-0 rounded-2xl px-4 py-2.5 text-left text-white/60 transition hover:bg-white/6 hover:text-white"
            >
              About
            </a>
          </nav>
        </aside>

        <main className="flex-1 p-3 pb-8 sm:p-4 md:p-8 lg:p-10">
          <div className="mx-auto max-w-5xl space-y-4 md:space-y-6">
            <section className="rounded-[28px] border border-white/8 bg-white/[0.045] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-2xl md:p-7">
              <div className="mb-5">
                <h2 className="text-2xl font-semibold tracking-tight md:text-4xl">
                  Lecture Translator
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50 md:text-base">
                  Upload a photo, screenshot, or PDF — or paste text.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-black/20 p-3 sm:p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-white md:text-base">
                      Input
                    </h3>
                    <p className="text-xs text-white/35 md:text-sm">
                      Camera, file, or text
                    </p>
                  </div>

                  <div className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[11px] text-white/55">
                    {isProcessing ? "Processing" : "Ready"}
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={openCameraPicker}
                    className="rounded-2xl border border-[#60a5fa]/20 bg-[#3b82f6]/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-[#3b82f6]/16"
                  >
                    Take Photo
                  </button>

                  <button
                    type="button"
                    onClick={openFilePicker}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/90 transition hover:bg-white/[0.07]"
                  >
                    Upload File
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,image/*"
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
                  <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {selectedFileName}
                      </p>
                      <p className="mt-1 text-xs text-white/40 capitalize">
                        {selectedFileType === "image" && "Image"}
                        {selectedFileType === "pdf" && "PDF"}
                        {selectedFileType === "word" && "Word"}
                        {selectedFileType === "powerpoint" && "PowerPoint"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={clearSelectedFile}
                      className="ml-3 shrink-0 rounded-xl border border-white/8 bg-white/[0.04] px-3 py-1.5 text-xs text-white/65 transition hover:bg-white/[0.07] hover:text-white"
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
                  placeholder="Paste lecture text here..."
                  className="h-40 w-full resize-none rounded-[24px] border border-white/8 bg-[#09101f]/80 px-4 py-4 text-sm text-white placeholder:text-white/22 outline-none transition focus:border-[#60a5fa]/45 focus:bg-[#09101f] md:h-48"
                />

                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    "Phone photos",
                    "Screenshots",
                    "PDFs",
                    "Word Docs",
                    "PowerPoints",
                  ].map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-xs text-white/55"
                      >
                        {item}
                      </span>
                  ))}
                </div>

                {error && (
                  <div className="mt-4 rounded-2xl border border-red-400/15 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </div>
                )}
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 md:gap-6">
              <div className="rounded-[28px] border border-white/8 bg-white/[0.045] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl md:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold md:text-lg">
                      Simple English
                    </h3>
                    <p className="text-xs text-white/40 md:text-sm">
                      Easier wording
                    </p>
                  </div>
                  {isProcessing && (
                    <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#60a5fa]" />
                  )}
                </div>

                {isProcessing ? (
                  <LoadingLines />
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-7 text-white/75">
                    {result.simple ||
                      "Your simplified explanation will appear here."}
                  </p>
                )}
              </div>

              <div className="rounded-[28px] border border-white/8 bg-white/[0.045] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl md:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold md:text-lg">
                      Arabic Explanation
                    </h3>
                    <p className="text-xs text-white/40 md:text-sm">
                      شرح مبسط
                    </p>
                  </div>
                  {isProcessing && (
                    <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#60a5fa]" />
                  )}
                </div>

                {isProcessing ? (
                  <LoadingLines arabic />
                ) : (
                  <p
                    dir="ltr"
                    className="whitespace-pre-wrap text-left text-sm leading-7 text-white/75"
                  >
                    {result.arabicExplanation || "سيظهر الشرح هنا."}
                  </p>
                )}
              </div>

              <div className="rounded-[28px] border border-white/8 bg-white/[0.045] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl md:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold md:text-lg">
                      Arabic Translation
                    </h3>
                    <p className="text-xs text-white/40 md:text-sm">
                      Direct translation
                    </p>
                  </div>
                  {isProcessing && (
                    <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#60a5fa]" />
                  )}
                </div>

                {isProcessing ? (
                  <LoadingLines arabic />
                ) : (
                  <p
                    dir="ltr"
                    className="whitespace-pre-wrap text-left text-sm leading-7 text-white/75"
                  >
                    {result.arabicTranslation || "ستظهر الترجمة هنا."}
                  </p>
                )}
              </div>

              <div className="rounded-[28px] border border-white/8 bg-white/[0.045] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl md:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold md:text-lg">
                      Keywords
                    </h3>
                    <p className="text-xs text-white/40 md:text-sm">
                      Key terms
                    </p>
                  </div>
                  {isProcessing && (
                    <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#60a5fa]" />
                  )}
                </div>

                {isProcessing ? (
                  <div className="flex flex-wrap gap-2">
                    <div className="h-8 w-36 animate-pulse rounded-full bg-white/8" />
                    <div className="h-8 w-44 animate-pulse rounded-full bg-white/8" />
                    <div className="h-8 w-32 animate-pulse rounded-full bg-white/8" />
                  </div>
                ) : result.keywords.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {result.keywords.map((keyword, index) => (
                      <span
                        key={`${keyword.en}-${index}`}
                        className="rounded-full border border-[#60a5fa]/20 bg-[#3b82f6]/10 px-3 py-1.5 text-xs text-[#d8ebff]"
                      >
                        {keyword.en} — {keyword.ar}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-xs text-white/55">
                    Keywords will appear here
                  </span>
                )}
              </div>
            </section>

            {!isProcessing && !hasResult && !error && (
              <div className="px-1 text-center text-sm text-white/35">
                Upload something or paste text to begin.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
