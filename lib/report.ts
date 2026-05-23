import type { Candidate, DailyReport } from "@/lib/types";

function formatBeijingDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function isSameBeijingDate(isoDate: string, date = new Date()) {
  return formatBeijingDate(new Date(isoDate)) === formatBeijingDate(date);
}

function countBy<T extends string>(
  candidates: Candidate[],
  getValue: (candidate: Candidate) => T | string
) {
  return candidates.reduce<Record<string, number>>((counts, candidate) => {
    const value = getValue(candidate);
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function topPositionHighlight(candidates: Candidate[]) {
  const todayCandidates = candidates.filter((candidate) =>
    isSameBeijingDate(candidate.createdAt)
  );
  const counts = countBy(todayCandidates, (candidate) => candidate.position);
  const [position, count] =
    Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? [];

  return position && count > 0 ? `${position}岗位新增 ${count} 名候选人` : null;
}

export function buildDailyReport(candidates: Candidate[]): DailyReport {
  const date = formatBeijingDate();
  const todayNew = candidates.filter((candidate) =>
    isSameBeijingDate(candidate.createdAt)
  ).length;
  const pendingFollowUp = candidates.filter((candidate) =>
    ["待跟进", "待安排", "待反馈"].includes(candidate.status)
  ).length;
  const passed = candidates.filter((candidate) =>
    ["已通过", "已完成"].includes(candidate.status)
  ).length;
  const failed = candidates.filter((candidate) => candidate.status === "未通过")
    .length;
  const feedbackPending = candidates.filter(
    (candidate) => candidate.status === "待反馈"
  ).length;
  const nextRoundPending = candidates.filter(
    (candidate) =>
      candidate.nextAction?.includes("安排") && candidate.status !== "未通过"
  );
  const missingInterviewTime = candidates.filter(
    (candidate) =>
      ["一面", "二面", "终面"].includes(candidate.stage) &&
      !candidate.interviewTime
  ).length;
  const missingFeedback = candidates.filter(
    (candidate) => !candidate.feedback || candidate.feedback.trim().length === 0
  ).length;
  const lowConfidence = candidates.filter((candidate) => candidate.confidence < 0.7)
    .length;
  const positionHighlight = topPositionHighlight(candidates);

  const highlights = [
    positionHighlight,
    feedbackPending > 0 ? `一面/面试阶段待反馈人数为 ${feedbackPending} 人` : null,
    nextRoundPending.length > 0
      ? `有 ${nextRoundPending.length} 名候选人需要尽快安排下一轮`
      : null,
    passed > 0 ? `已有 ${passed} 名候选人处于通过或完成状态` : null
  ].filter((item): item is string => Boolean(item));

  const todos = candidates
    .filter((candidate) => candidate.nextAction && candidate.status !== "未通过")
    .slice(0, 6)
    .map((candidate) => `${candidate.name}：${candidate.nextAction}`);

  const risks = [
    missingInterviewTime > 0
      ? `${missingInterviewTime} 名面试中候选人缺少面试时间`
      : null,
    missingFeedback > 0 ? `${missingFeedback} 名候选人缺少反馈原因` : null,
    lowConfidence > 0 ? `${lowConfidence} 条 AI 抽取记录置信度低于 70%` : null
  ].filter((item): item is string => Boolean(item));

  return {
    date,
    summary: `今日共跟进 ${candidates.length} 名候选人，新增 ${todayNew} 人，待跟进 ${pendingFollowUp} 人，已通过 ${passed} 人，未通过 ${failed} 人。`,
    highlights:
      highlights.length > 0 ? highlights : ["当前招聘进度整体平稳，暂无明显异常。"],
    todos: todos.length > 0 ? todos : ["检查低置信度记录并补充必要备注。"],
    risks: risks.length > 0 ? risks : ["暂无明显数据完整性风险。"]
  };
}
