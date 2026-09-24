import Link from "next/link";
import { Compass, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-canvas border border-line text-brass mb-6">
        <Compass className="h-8 w-8" />
      </div>
      <h1 className="font-display text-4xl font-bold text-navy-900 tracking-tight">
        404 — Page Not Found
      </h1>
      <p className="mt-3 text-sm text-ink-2 max-w-md">
        The residence, document, or portal surface you requested could not be located on the Settly network.
      </p>
      <div className="mt-8 flex items-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-navy-800"
        >
          <Home className="h-4 w-4 text-brass" />
          <span>Return Home</span>
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-5 py-2.5 text-xs font-semibold text-navy-900 transition hover:bg-canvas"
        >
          <Compass className="h-4 w-4 text-navy-900" />
          <span>Explore Properties</span>
        </Link>
      </div>
    </div>
  );
}
