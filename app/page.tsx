import { AlertCircle, CheckCircle2, Clock3, UsersRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DailyReportCard } from "@/components/daily-report-card";
import { DashboardCharts } from "@/components/dashboard-charts";
import { MetricCard } from "@/components/metric-card";
import { buildDashboardData } from "@/lib/dashboard";
import { getCandidates } from "@/lib/store";
import { formatDateTime } from "@/lib/utils";

export default async function DashboardPage() {
  const candidates = await getCandidates();
  const dashboard = buildDashboardData(candidates);

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="总候选人数"
            value={dashboard.metrics.total}
            helper="当前招聘池结构化记录"
            icon={UsersRound}
          />
          <MetricCard
            label="今日新增"
            value={dashboard.metrics.todayNew}
            helper="按北京时间统计创建时间"
            icon={Clock3}
          />
          <MetricCard
            label="待跟进"
            value={dashboard.metrics.pendingFollowUp}
            helper="待跟进、待安排、待反馈"
            icon={AlertCircle}
          />
          <MetricCard
            label="已通过"
            value={dashboard.metrics.passed}
            helper="已通过或已完成状态"
            icon={CheckCircle2}
          />
        </div>

        <DashboardCharts
          funnel={dashboard.funnel}
          positions={dashboard.positions}
        />

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-ink">最近更新</h2>
              <p className="mt-1 text-sm text-slate-500">
                从群聊记录抽取后同步到候选人表
              </p>
            </div>
            <div className="space-y-3">
              {dashboard.recentUpdates.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">{item.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.position} / {item.stage} / {item.status}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {formatDateTime(item.updatedAt)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-2xl border border-ocean/20 bg-ocean/8 p-5 shadow-panel">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">AI 今日摘要</h2>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-ocean">
                Mock
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-700">
              {dashboard.dailySummary}
            </p>
            <div className="mt-5 rounded-xl bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Next Step
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                下一阶段将接入群聊导入页：粘贴模拟企业微信群聊，AI 抽取后预览并入库。
              </p>
            </div>
          </aside>
        </div>

        <DailyReportCard />
      </div>
    </AppShell>
  );
}
