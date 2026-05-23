import type { CandidateStatus, Stage } from "@/lib/types";

export const STAGES: Stage[] = [
  "简历筛选",
  "一面",
  "二面",
  "终面",
  "Offer",
  "已淘汰",
  "待确认"
];

export const STATUSES: CandidateStatus[] = [
  "待跟进",
  "已通过",
  "未通过",
  "待安排",
  "待反馈",
  "已完成"
];

export const POSITIONS = [
  "管培生",
  "AI 应用工程师",
  "测试工程师",
  "产品运营",
  "待确认",
  "其他"
];

export const STAGE_TONE: Record<Stage, string> = {
  简历筛选: "bg-slate-100 text-slate-700",
  一面: "bg-sky-100 text-sky-700",
  二面: "bg-cyan-100 text-cyan-700",
  终面: "bg-indigo-100 text-indigo-700",
  Offer: "bg-emerald-100 text-emerald-700",
  已淘汰: "bg-zinc-100 text-zinc-600",
  待确认: "bg-amber-100 text-amber-700"
};

export const STATUS_TONE: Record<CandidateStatus, string> = {
  待跟进: "bg-amber-100 text-amber-800",
  已通过: "bg-emerald-100 text-emerald-800",
  未通过: "bg-rose-100 text-rose-800",
  待安排: "bg-blue-100 text-blue-800",
  待反馈: "bg-purple-100 text-purple-800",
  已完成: "bg-slate-100 text-slate-700"
};
