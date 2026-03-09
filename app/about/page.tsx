import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_28%),linear-gradient(180deg,_#050816_0%,_#0a1020_45%,_#0d1528_100%)] text-white">
      <div className="mx-auto max-w-3xl px-6 py-12">

        <Link
          href="/"
          className="mb-8 inline-flex rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/80 transition hover:bg-white/[0.08]"
        >
          ← Back
        </Link>

        <h1 className="mb-8 text-3xl font-semibold tracking-tight">
          About
        </h1>

        <div className="space-y-6 text-white/80">

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
            <h2 className="mb-3 text-xl font-semibold">How it works</h2>
            <p className="leading-7 text-white/75">
              Upload a phone photo, screenshot, or PDF of your lecture material.
              You can also paste text directly. The system automatically generates:
            </p>

            <ul className="mt-3 list-disc space-y-1 pl-5 text-white/70">
              <li>Simple English explanation</li>
              <li>Arabic explanation</li>
              <li>Arabic translation</li>
              <li>Key academic terms with Arabic meaning</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
            <h2 className="mb-3 text-xl font-semibold">Privacy</h2>

            <p className="leading-7 text-white/75">
              Uploaded files and pasted text are processed only to generate
              explanations and translations. This tool does not intentionally
              store lecture materials or personal information.
            </p>

            <p className="mt-3 leading-7 text-white/70">
              Do not upload sensitive or personal data.
            </p>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
            <h2 className="mb-3 text-xl font-semibold">Independence</h2>

            <p className="leading-7 text-white/75">
              This project is an independent tool created to help students
              understand English lecture material more easily.
            </p>

            <p className="mt-3 leading-7 text-white/70">
              It is <strong>not affiliated with, endorsed by, or operated by</strong>{" "}
              any university or educational institution.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}