export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,94,184,0.18),_transparent_30%),linear-gradient(180deg,_#060914_0%,_#0b1020_45%,_#0f172a_100%)] text-white">
      <div className="mx-auto max-w-3xl px-6 py-12">

        <h1 className="text-3xl font-semibold tracking-tight mb-6">
          About UDST Notes Translator
        </h1>

        <div className="space-y-8 text-white/80 leading-7">

          <section>
            <h2 className="text-xl font-semibold mb-2">What this tool does</h2>
            <p>
              UDST Notes Translator helps students understand lecture material
              written in English by automatically generating:
            </p>

            <ul className="list-disc ml-6 mt-3 space-y-1">
              <li>Simple English explanations</li>
              <li>Arabic explanations</li>
              <li>Arabic translations of lecture text</li>
              <li>Important keywords with Arabic meanings</li>
            </ul>

            <p className="mt-3">
              Students can upload photos of lecture slides, screenshots,
              PDFs, PowerPoints, or paste text directly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">How to use it</h2>

            <ol className="list-decimal ml-6 mt-3 space-y-1">
              <li>Take a photo of lecture slides or upload a document.</li>
              <li>Or paste lecture text into the input box.</li>
              <li>The system will automatically process the content.</li>
              <li>Read the simplified explanation and translations.</li>
            </ol>

            <p className="mt-3">
              The tool is designed to reduce language barriers for students
              studying in English-based courses.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Privacy</h2>

            <p>
              Uploaded images, documents, and text are processed only for the
              purpose of generating explanations and translations.
            </p>

            <p className="mt-3">
              No lecture materials are permanently stored unless future
              features explicitly allow users to save their history.
            </p>

            <p className="mt-3">
              Students should avoid uploading sensitive personal information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Disclaimer</h2>

            <p>
              This tool is an independent project created to help students
              understand academic material.
            </p>

            <p className="mt-3">
              It is <strong>not affiliated with, endorsed by, or operated by</strong>{" "}
              any university, including the{" "}
              University of Doha for Science and Technology.
            </p>

            <p className="mt-3">
              All university names are used only to describe the intended
              audience of the tool.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}