import { POSITIONS, STAGES } from "@/lib/constants";
import type { Candidate, ChartDatum, DashboardData } from "@/lib/types";

function countBy<T extends string>(
  candidates: Candidate[],
  values: readonly T[],
  getValue: (candidate: Candidate) => T | string
): ChartDatum[] {
  return values.map((value) => ({
    name: value,
    value: candidates.filter((candidate) => getValue(candidate) === value).length
  }));
}

function isSameBeijingDay(isoDate: string, reference = new Date()) {
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  return formatter.format(new Date(isoDate)) === formatter.format(reference);
}

export function buildDashboardData(candidates: Candidate[]): DashboardData {
  const todayNew = candidates.filter((candidate) =>
    isSameBeijingDay(candidate.createdAt)
  ).length;

  const pendingFollowUp = candidates.filter((candidate) =>
    ["待跟进", "待安排", "待反馈"].includes(candidate.status)
  ).length;

  const passed = candidates.filter((candidate) =>
    ["已通过", "已完成"].includes(candidate.status)
  ).length;

  const recentUpdates = [...candidates]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 6)
    .map(({ id, name, position, stage, status, updatedAt }) => ({
      id,
      name,
      position,
      stage,
      status,
      updatedAt
    }));

  const highPriority = candidates
    .filter((candidate) => candidate.nextAction && candidate.status !== "未通过")
    .slice(0, 3)
    .map((candidate) => `${candidate.name}：${candidate.nextAction}`)
    .join("；");

  return {
    metrics: {
      total: candidates.length,
      todayNew,
      pendingFollowUp,
      passed
    },
    funnel: countBy(candidates, STAGES, (candidate) => candidate.stage),
    positions: countBy(candidates, POSITIONS, (candidate) => candidate.position),
    recentUpdates,
    dailySummary:
      highPriority.length > 0
        ? `今日重点跟进 ${pendingFollowUp} 人。优先处理：${highPriority}。`
        : "当前暂无紧急待办，建议检查低置信度候选人记录。"
  };
}
