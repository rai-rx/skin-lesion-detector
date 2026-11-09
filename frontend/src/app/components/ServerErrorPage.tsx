import { RefreshCw, ServerCrash } from 'lucide-react';

export function ServerErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f0e8] px-6 py-12 text-[#24332d]">
      <section className="w-full max-w-lg rounded-3xl border border-[#d7d2c7] bg-white p-8 text-center shadow-xl sm:p-12">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f7e8e3] text-[#a64b3c]">
          <ServerCrash aria-hidden="true" className="h-8 w-8" />
        </div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#a64b3c]">
          Service unavailable
        </p>
        <h1 className="mb-4 text-3xl font-display font-bold">We hit a server problem</h1>
        <p className="mb-8 leading-relaxed text-[#607268]">
          The server is temporarily unavailable or encountered an error. Please try again in a little while.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2f604e] px-6 py-3 font-medium text-white transition-colors hover:bg-[#244b3d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f604e]"
        >
          <RefreshCw aria-hidden="true" className="h-4 w-4" />
          Try again
        </button>
      </section>
    </main>
  );
}
