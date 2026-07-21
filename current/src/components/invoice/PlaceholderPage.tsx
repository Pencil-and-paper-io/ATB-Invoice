import { TopNav } from "./TopNav";

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-page-grey">
      <TopNav />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="type-headline-2 text-midnight-ink">{title}</h1>
        <p className="mt-4 text-base text-black/55">
          This page is a placeholder and is not built yet.
        </p>
      </main>
    </div>
  );
}
