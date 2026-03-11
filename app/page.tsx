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

type UiLanguage = "en" | "ar";

const IMAGE_UPLOAD_TARGET_MAX_BYTES = 4 * 1024 * 1024;
const IMAGE_UPLOAD_MAX_DIMENSION = 2200;
const IMAGE_UPLOAD_MIN_QUALITY = 0.55;

const uiText = {
  en: {
    appName: "Translator",
    support: "English to Arabic support",
    translatorNav: "Translator",
    aboutNav: "About",
    languageToggle: "العربية",
    heading: "Lecture Translator",
    subHeading: "Upload a photo, screenshot, or PDF — or paste text.",
    inputTitle: "Input",
    inputHint: "Camera, file, or text",
    statusProcessing: "Processing",
    statusReady: "Ready",
    takePhoto: "Take Photo",
    uploadFile: "Upload File",
    clear: "Clear",
    placeholder: "Paste lecture text here...",
    chips: ["Phone photos", "Screenshots", "PDFs", "Word Docs", "PowerPoints"],
    simpleTitle: "Simple English",
    simpleHint: "Easier wording",
    simpleEmpty: "Your simplified explanation will appear here.",
    explanationTitle: "Arabic Explanation",
    explanationHint: "شرح مبسط",
    explanationEmpty: "سيظهر الشرح هنا.",
    translationTitle: "Arabic Translation",
    translationHint: "Direct translation",
    translationEmpty: "ستظهر الترجمة هنا.",
    keywordsTitle: "Keywords",
    keywordsHint: "Key terms",
    keywordsEmpty: "Keywords will appear here",
    startHint: "Upload something or paste text to begin.",
    fileTypeImage: "Image",
    fileTypePdf: "PDF",
    fileTypeWord: "Word",
    fileTypePowerpoint: "PowerPoint",
  },
  ar: {
    appName: "المترجم",
    support: "دعم من الإنجليزية إلى العربية",
    translatorNav: "المترجم",
    aboutNav: "حول",
    languageToggle: "English",
    heading: "مترجم المحاضرات",
    subHeading: "ارفع صورة أو لقطة شاشة أو ملف PDF — أو الصق النص مباشرة.",
    inputTitle: "الإدخال",
    inputHint: "الكاميرا أو ملف أو نص",
    statusProcessing: "جارٍ المعالجة",
    statusReady: "جاهز",
    takePhoto: "التقاط صورة",
    uploadFile: "رفع ملف",
    clear: "مسح",
    placeholder: "الصق نص المحاضرة هنا...",
    chips: ["صور الهاتف", "لقطات الشاشة", "ملفات PDF", "مستندات Word", "عروض PowerPoint"],
    simpleTitle: "إنجليزية مبسطة",
    simpleHint: "صياغة أسهل",
    simpleEmpty: "سيظهر الشرح المبسط هنا.",
    explanationTitle: "شرح بالعربية",
    explanationHint: "شرح مبسط",
    explanationEmpty: "سيظهر الشرح هنا.",
    translationTitle: "الترجمة العربية",
    translationHint: "ترجمة مباشرة",
    translationEmpty: "ستظهر الترجمة هنا.",
    keywordsTitle: "الكلمات المفتاحية",
    keywordsHint: "مصطلحات أساسية",
    keywordsEmpty: "ستظهر الكلمات المفتاحية هنا",
    startHint: "ابدأ برفع ملف أو لصق نص.",
    fileTypeImage: "صورة",
    fileTypePdf: "PDF",
    fileTypeWord: "Word",
    fileTypePowerpoint: "PowerPoint",
  },
} as const;

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

async function callExplainApi(formData: FormData): Promise<Response> {
  return fetch("api/explain", {
    method: "POST",
    body: formData,
  });
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read uploaded image."));
    };

    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not compress uploaded image."));
          return;
        }
        resolve(blob);
      },
      type,
      quality
    );
  });
}

async function prepareImageForUpload(file: File): Promise<File> {
  if (file.size <= IMAGE_UPLOAD_TARGET_MAX_BYTES) {
    return file;
  }

  const image = await loadImageElement(file);

  const downscaleRatio = Math.min(
    1,
    IMAGE_UPLOAD_MAX_DIMENSION / Math.max(image.width, image.height)
  );

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * downscaleRatio));
  canvas.height = Math.max(1, Math.round(image.height * downscaleRatio));

  const context = canvas.getContext("2d");
  if (!context) {
    return file;
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const outputType = file.type === "image/png" ? "image/jpeg" : file.type;
  const qualitySteps = [0.85, 0.75, 0.65, IMAGE_UPLOAD_MIN_QUALITY];

  for (const quality of qualitySteps) {
    const blob = await canvasToBlob(canvas, outputType, quality);
    if (blob.size <= IMAGE_UPLOAD_TARGET_MAX_BYTES || quality === IMAGE_UPLOAD_MIN_QUALITY) {
      const extension = outputType === "image/jpeg" ? "jpg" : file.name.split(".").pop() || "img";
      const safeName = file.name.replace(/\.[^.]+$/, "") || "photo";
      return new File([blob], `${safeName}-optimized.${extension}`, { type: outputType });
    }
  }

  return file;
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
  const [language, setLanguage] = useState<UiLanguage>("en");
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

  const t = uiText[language];

  const processText = async (textValue: string) => {
    if (!textValue.trim()) return;

    setIsProcessing(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("text", textValue);

      const res = await callExplainApi(formData);

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

      const res = await callExplainApi(formData);

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

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let uploadFile = file;

    if (file.type.startsWith("image/")) {
      try {
        uploadFile = await prepareImageForUpload(file);
      } catch {
        uploadFile = file;
      }
    }

    setSelectedFile(uploadFile);
    setSelectedFileName(uploadFile.name);
    setInput("");
    setError("");
    setResult(emptyResult);

    const lowerName = uploadFile.name.toLowerCase();

    if (uploadFile.type.startsWith("image/")) {
      setSelectedFileType("image");
    } else if (uploadFile.type === "application/pdf" || lowerName.endsWith(".pdf")) {
      setSelectedFileType("pdf");
    } else if (
      uploadFile.type.includes("word") ||
      uploadFile.type.includes("officedocument.wordprocessingml") ||
      lowerName.endsWith(".doc") ||
      lowerName.endsWith(".docx")
    ) {
      setSelectedFileType("word");
    } else {
      setSelectedFileType("powerpoint");
    }

    void processFile(uploadFile);
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
    <div
      dir={language === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(30,41,59,0.35),_transparent_35%),linear-gradient(180deg,_#030711_0%,_#060b16_52%,_#0a1220_100%)] text-slate-100"
    >
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col md:flex-row">
        <aside className="sticky top-0 z-20 border-b border-slate-700/35 bg-[#060d1a]/90 backdrop-blur-xl md:h-screen md:w-64 md:border-b-0 md:border-r">
          <div className="px-4 py-4 md:p-6">
            <h1 className="text-lg font-semibold tracking-tight md:text-xl">{t.appName}</h1>
            <p className="mt-1 text-sm text-slate-400">{t.support}</p>
          </div>

          <nav className="flex gap-2 overflow-x-auto px-4 pb-4 text-sm [&::-webkit-scrollbar]:hidden md:flex-col md:px-6 md:pb-0">
            <button className="shrink-0 rounded-2xl border border-slate-500/40 bg-slate-700/30 px-4 py-2.5 text-left text-slate-100 shadow-[0_8px_26px_rgba(15,23,42,0.28)]">
              {t.translatorNav}
            </button>
            <a
              href="/about"
              className="shrink-0 rounded-2xl px-4 py-2.5 text-left text-slate-400 transition hover:bg-slate-800/60 hover:text-slate-100"
            >
              {t.aboutNav}
            </a>
            <button
              type="button"
              onClick={() => setLanguage((prev) => (prev === "en" ? "ar" : "en"))}
              className="shrink-0 rounded-2xl border border-slate-600/40 bg-slate-800/55 px-4 py-2.5 text-left text-slate-200 transition hover:bg-slate-700/55"
            >
              {t.languageToggle}
            </button>
          </nav>
        </aside>

        <main className="flex-1 p-3 pb-8 sm:p-4 md:p-8 lg:p-10">
          <div className="mx-auto max-w-5xl space-y-4 md:space-y-6">
            <section className="rounded-[28px] border border-slate-700/40 bg-slate-900/45 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.38)] backdrop-blur-xl md:p-7">
              <div className="mb-5">
                <h2 className="text-2xl font-semibold tracking-tight md:text-4xl">{t.heading}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">{t.subHeading}</p>
              </div>

              <div className="rounded-[24px] border border-slate-700/45 bg-[#050a15]/70 p-3 sm:p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-slate-100 md:text-base">{t.inputTitle}</h3>
                    <p className="text-xs text-slate-500 md:text-sm">{t.inputHint}</p>
                  </div>

                  <div className="rounded-full border border-slate-600/50 bg-slate-800/70 px-3 py-1 text-[11px] text-slate-300">
                    {isProcessing ? t.statusProcessing : t.statusReady}
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={openCameraPicker}
                    className="rounded-2xl border border-slate-500/40 bg-slate-700/35 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-slate-600/40"
                  >
                    {t.takePhoto}
                  </button>

                  <button
                    type="button"
                    onClick={openFilePicker}
                    className="rounded-2xl border border-slate-600/50 bg-slate-800/65 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-slate-700/70"
                  >
                    {t.uploadFile}
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
                  <div className="mb-4 flex items-center justify-between rounded-2xl border border-slate-700/50 bg-slate-800/55 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-100">{selectedFileName}</p>
                      <p className="mt-1 text-xs text-slate-400 capitalize">
                        {selectedFileType === "image" && t.fileTypeImage}
                        {selectedFileType === "pdf" && t.fileTypePdf}
                        {selectedFileType === "word" && t.fileTypeWord}
                        {selectedFileType === "powerpoint" && t.fileTypePowerpoint}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={clearSelectedFile}
                      className="ml-3 shrink-0 rounded-xl border border-slate-600/60 bg-slate-700/55 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-slate-600/70 hover:text-slate-100"
                    >
                      {t.clear}
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
                  placeholder={t.placeholder}
                  className="h-40 w-full resize-none rounded-[24px] border border-slate-700/55 bg-slate-950/75 px-4 py-4 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-slate-500/75 focus:bg-slate-950 md:h-48"
                />

                <div className="mt-4 flex flex-wrap gap-2">
                  {t.chips.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-slate-700/60 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                {error && (
                  <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </div>
                )}
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 md:gap-6">
              <div className="rounded-[28px] border border-slate-700/45 bg-slate-900/50 p-5 shadow-[0_14px_40px_rgba(0,0,0,0.34)] backdrop-blur-xl md:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold md:text-lg">{t.simpleTitle}</h3>
                    <p className="text-xs text-slate-500 md:text-sm">{t.simpleHint}</p>
                  </div>
                  {isProcessing && <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-slate-300" />}
                </div>

                {isProcessing ? (
                  <LoadingLines />
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">{result.simple || t.simpleEmpty}</p>
                )}
              </div>

              <div className="rounded-[28px] border border-slate-700/45 bg-slate-900/50 p-5 shadow-[0_14px_40px_rgba(0,0,0,0.34)] backdrop-blur-xl md:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold md:text-lg">{t.explanationTitle}</h3>
                    <p className="text-xs text-slate-500 md:text-sm">{t.explanationHint}</p>
                  </div>
                  {isProcessing && <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-slate-300" />}
                </div>

                {isProcessing ? (
                  <LoadingLines arabic />
                ) : (
                  <p dir="ltr" className="whitespace-pre-wrap text-left text-sm leading-7 text-slate-300">
                    {result.arabicExplanation || t.explanationEmpty}
                  </p>
                )}
              </div>

              <div className="rounded-[28px] border border-slate-700/45 bg-slate-900/50 p-5 shadow-[0_14px_40px_rgba(0,0,0,0.34)] backdrop-blur-xl md:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold md:text-lg">{t.translationTitle}</h3>
                    <p className="text-xs text-slate-500 md:text-sm">{t.translationHint}</p>
                  </div>
                  {isProcessing && <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-slate-300" />}
                </div>

                {isProcessing ? (
                  <LoadingLines arabic />
                ) : (
                  <p dir="ltr" className="whitespace-pre-wrap text-left text-sm leading-7 text-slate-300">
                    {result.arabicTranslation || t.translationEmpty}
                  </p>
                )}
              </div>

              <div className="rounded-[28px] border border-slate-700/45 bg-slate-900/50 p-5 shadow-[0_14px_40px_rgba(0,0,0,0.34)] backdrop-blur-xl md:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold md:text-lg">{t.keywordsTitle}</h3>
                    <p className="text-xs text-slate-500 md:text-sm">{t.keywordsHint}</p>
                  </div>
                  {isProcessing && <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-slate-300" />}
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
                        className="rounded-full border border-slate-500/45 bg-slate-700/45 px-3 py-1.5 text-xs text-slate-100"
                      >
                        {keyword.en} — {keyword.ar}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="rounded-full border border-slate-700/55 bg-slate-800/55 px-3 py-1.5 text-xs text-slate-300">
                    {t.keywordsEmpty}
                  </span>
                )}
              </div>
            </section>

            {!isProcessing && !hasResult && !error && (
              <div className="px-1 text-center text-sm text-slate-500">{t.startHint}</div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
