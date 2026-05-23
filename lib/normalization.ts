import { POSITIONS, STAGES, STATUSES } from "@/lib/constants";
import type { Candidate, CandidateStatus, ExtractedCandidate, Stage } from "@/lib/types";

const fallbackStage: Stage = "待确认";
const fallbackStatus: CandidateStatus = "待跟进";
const fallbackPosition = "待确认";

const positionAliases: Record<string, string> = {
  AI应用工程师: "AI 应用工程师",
  AI应用: "AI 应用工程师",
  AI工程师: "AI 应用工程师",
  人工智能应用工程师: "AI 应用工程师",
  测试: "测试工程师",
  软件测试: "测试工程师",
  自动化测试: "测试工程师",
  产品: "产品运营",
  运营: "产品运营",
  管培: "管培生",
  管培生: "管培生",
  管理培训生: "管培生",
  AI相关: "待确认",
  岗位不明确: "待确认",
  未知值: "待确认",
  未知: "待确认",
  空值: "待确认"
};

const vaguePositionValues = new Set([
  "",
  "AI相关",
  "AI 相关",
  "岗位不明确",
  "不明确",
  "待确认",
  "待定",
  "未知",
  "未知值",
  "空值"
]);

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function asNullableString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

export function normalizePosition(value: unknown) {
  const raw = asString(value, fallbackPosition);
  const compact = raw.replace(/\s+/g, "");

  if (vaguePositionValues.has(raw) || vaguePositionValues.has(compact)) {
    return fallbackPosition;
  }

  if (POSITIONS.includes(raw)) {
    return raw;
  }

  if (positionAliases[raw]) {
    return positionAliases[raw];
  }

  if (positionAliases[compact]) {
    return positionAliases[compact];
  }

  if (/AI|人工智能/i.test(raw) && /相关|不明确|好像/.test(raw)) {
    return fallbackPosition;
  }

  if (/AI|人工智能/i.test(raw) && /应用|工程师/.test(raw)) {
    return "AI 应用工程师";
  }

  if (/测试/.test(raw)) {
    return "测试工程师";
  }

  if (/产品|运营/.test(raw)) {
    return "产品运营";
  }

  if (/管培|管理培训/.test(raw)) {
    return "管培生";
  }

  return "其他";
}

export function normalizeStage(value: unknown): Stage {
  const raw = asString(value, fallbackStage);

  if (STAGES.includes(raw as Stage)) {
    return raw as Stage;
  }

  if (/淘汰|未通过|不通过|不合适/.test(raw)) return "已淘汰";
  if (/简历|筛选|初筛/.test(raw)) return "简历筛选";
  if (/一面|初面/.test(raw)) return "一面";
  if (/二面/.test(raw)) return "二面";
  if (/终面/.test(raw)) return "终面";
  if (/offer/i.test(raw)) return "Offer";
  if (/待确认|待定|信息不完整/.test(raw)) return "待确认";

  return fallbackStage;
}

export function normalizeStatus(value: unknown): CandidateStatus {
  const raw = asString(value, fallbackStatus);

  if (STATUSES.includes(raw as CandidateStatus)) {
    return raw as CandidateStatus;
  }

  if (/未通过|不通过|淘汰|不合适/.test(raw)) return "未通过";
  if (/待反馈|反馈待补充/.test(raw)) return "待反馈";
  if (/待安排|安排|预约|约/.test(raw)) return "待安排";
  if (/已完成|完成/.test(raw)) return "已完成";
  if (/已通过|通过/.test(raw)) return "已通过";
  if (/待确认|待定|待跟进|补充|不完整/.test(raw)) return "待跟进";

  return fallbackStatus;
}

export function normalizeConfidence(value: unknown) {
  const numberValue = typeof value === "number" ? value : Number(value);

  if (Number.isFinite(numberValue)) {
    return Math.min(1, Math.max(0, numberValue));
  }

  return 0.65;
}

export function normalizeCandidate<T extends Partial<Candidate>>(candidate: T): T {
  return {
    ...candidate,
    ...(candidate.name !== undefined ? { name: asString(candidate.name, "未知候选人") } : {}),
    ...(candidate.position !== undefined
      ? { position: normalizePosition(candidate.position) }
      : {}),
    ...(candidate.stage !== undefined ? { stage: normalizeStage(candidate.stage) } : {}),
    ...(candidate.status !== undefined
      ? { status: normalizeStatus(candidate.status) }
      : {}),
    ...(candidate.result !== undefined ? { result: asNullableString(candidate.result) } : {}),
    ...(candidate.confidence !== undefined
      ? { confidence: normalizeConfidence(candidate.confidence) }
      : {})
  };
}

export function normalizeExtractedCandidateFields(
  value: Partial<ExtractedCandidate>
): ExtractedCandidate {
  return {
    name: asString(value.name, "未知候选人"),
    position: normalizePosition(value.position),
    school: asNullableString(value.school),
    background: asNullableString(value.background),
    stage: normalizeStage(value.stage),
    status: normalizeStatus(value.status),
    result: asNullableString(value.result),
    feedback: asNullableString(value.feedback),
    interviewTime: asNullableString(value.interviewTime),
    owner: asNullableString(value.owner),
    nextAction: asNullableString(value.nextAction),
    aiSummary: asNullableString(value.aiSummary),
    confidence: normalizeConfidence(value.confidence)
  };
}
