"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { ChartDatum } from "@/lib/types";

type DashboardChartsProps = {
  funnel: ChartDatum[];
  positions: ChartDatum[];
};

export function DashboardCharts({ funnel, positions }: DashboardChartsProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-ink">招聘漏斗</h2>
          <p className="mt-1 text-sm text-slate-500">按当前阶段统计候选人分布</p>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnel}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "rgba(15, 107, 122, 0.08)" }} />
              <Bar dataKey="value" fill="#0F6B7A" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-ink">岗位分布</h2>
          <p className="mt-1 text-sm text-slate-500">当前岗位池候选人数量</p>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={positions} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} hide />
              <YAxis
                dataKey="name"
                type="category"
                width={92}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip cursor={{ fill: "rgba(73, 160, 120, 0.08)" }} />
              <Bar dataKey="value" fill="#49A078" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
