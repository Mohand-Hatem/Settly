import { CreditCard } from "lucide-react";

export const metadata = {
  title: "Subscription & Quota · Settly Agent Portal",
  description: "Manage your Settly subscription plan and listing quota.",
};

export default function AgentSubscriptionPage() {
  return (
    <div className="portal-content">
      <section className="welcome-bar">
        <div className="welcome-title-wrap">
          <h1>Subscription & Quota</h1>
          <p>Manage your plan, listing quota, and billing for the current period.</p>
        </div>
      </section>
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-2 bg-canvas py-20 text-center mt-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-900 text-brass mx-auto">
          <CreditCard className="h-7 w-7" />
        </div>
        <h2 className="mt-4 font-display text-lg font-bold text-navy-900">Subscription Plans</h2>
        <p className="mt-2 max-w-sm text-sm text-ink-3">
          Subscription management (Free / Pro / Enterprise plans) and Paymob payment integration are part of the next implementation slice.
        </p>
        <div className="mt-6 grid grid-cols-3 gap-4 max-w-md w-full">
          {[
            { name: "Free", quota: "2 listings/mo", price: "$0" },
            { name: "Pro", quota: "4 listings/mo", price: "$20" },
            { name: "Enterprise", quota: "8 listings/mo", price: "$50" },
          ].map((plan) => (
            <div key={plan.name} className="rounded-xl border border-line bg-white p-4 text-center shadow-settly">
              <p className="font-display text-sm font-bold text-navy-900">{plan.name}</p>
              <p className="mt-1 font-mono text-xs font-bold text-brass-600">{plan.price}<span className="text-ink-4 font-normal">/mo</span></p>
              <p className="mt-1 text-[11px] text-ink-3">{plan.quota}</p>
            </div>
          ))}
        </div>
        <span className="mt-6 inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-3 py-1 font-mono text-xs font-bold text-amber-800">
          COMING IN NEXT SLICE
        </span>
      </div>
    </div>
  );
}
