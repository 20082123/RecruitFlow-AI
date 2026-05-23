import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  label: string;
  value: number;
  helper: string;
  icon: LucideIcon;
};

export function MetricCard({
  label,
  value,
  helper,
  icon: Icon
}: MetricCardProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ocean/10 text-ocean">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-sm text-slate-500">{helper}</p>
    </section>
  );
}
