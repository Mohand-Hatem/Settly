import { BarChart3 } from "lucide-react";

export const metadata = {
  title: "Analytics · Settly Agent Portal",
  description: "View performance analytics for your listings.",
};

export default function AgentAnalyticsPage() {
  return (
    <div className="portal-content">
      <section className="welcome-bar">
        <div className="welcome-title-wrap">
          <h1>Analytics</h1>
          <p>Listing performance, view counts, and inquiry trends.</p>
        </div>
      </section>
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-2 bg-canvas py-20 text-center mt-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-900 text-brass mx-auto">
          <BarChart3 className="h-7 w-7" />
        </div>
        <h2 className="mt-4 font-display text-lg font-bold text-navy-900">Listing Analytics</h2>
        <p className="mt-2 max-w-sm text-sm text-ink-3">
          Analytics dashboards are part of a future implementation slice. Performance metrics will appear here.
        </p>
        <span className="mt-4 inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-3 py-1 font-mono text-xs font-bold text-amber-800">
          COMING IN NEXT SLICE
        </span>
      </div>
    </div>
  );
}
