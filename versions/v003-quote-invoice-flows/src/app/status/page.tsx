import fs from "node:fs";
import path from "node:path";
import Link from "next/link";

export const dynamic = "force-dynamic";

/** Minimal markdown rendering for the STATUS.md tracker (headers, bullets, bold). */
function renderInline(text: string, key: number) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span key={key}>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          part
        ),
      )}
    </span>
  );
}

function MarkdownLite({ source }: { source: string }) {
  const lines = source.split("\n");
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];

  function flushBullets(keyBase: number) {
    if (!bullets.length) return;
    blocks.push(
      <ul key={`ul-${keyBase}`} className="list-disc space-y-1.5 pl-6 text-sm text-black">
        {bullets.map((item, i) => (
          <li key={i}>{renderInline(item, i)}</li>
        ))}
      </ul>,
    );
    bullets = [];
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) {
      bullets.push(trimmed.slice(2));
      return;
    }
    flushBullets(i);
    if (trimmed.startsWith("# ")) {
      blocks.push(
        <h1 key={i} className="font-display text-3xl font-bold text-black">
          {trimmed.slice(2)}
        </h1>,
      );
    } else if (trimmed.startsWith("## ")) {
      blocks.push(
        <h2 key={i} className="mt-6 text-lg font-semibold text-black">
          {trimmed.slice(3)}
        </h2>,
      );
    } else if (trimmed.length) {
      blocks.push(
        <p key={i} className="text-sm leading-6 text-black/70">
          {renderInline(trimmed, i)}
        </p>,
      );
    }
  });
  flushBullets(lines.length);

  return <div className="flex flex-col gap-2.5">{blocks}</div>;
}

export default function StatusPage() {
  let source = "STATUS.md not found.";
  try {
    // STATUS.md lives at the repo root, one level above the Next app.
    source = fs.readFileSync(
      path.join(process.cwd(), "..", "STATUS.md"),
      "utf-8",
    );
  } catch {
    // keep fallback message
  }

  return (
    <div className="min-h-screen bg-page-grey text-black">
      <main className="mx-auto max-w-[760px] px-4 py-12 sm:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-semibold text-midnight-ink transition hover:text-prime-blue"
          >
            ← Back to prototype
          </Link>
          <span className="rounded bg-midnight-ink px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
            Prototype tracker
          </span>
        </div>
        <div className="rounded-[10px] bg-white p-8 shadow-sm">
          <MarkdownLite source={source} />
        </div>
      </main>
    </div>
  );
}
