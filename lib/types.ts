export type Stage =
  | "简历筛选"
  | "一面"
  | "二面"
  | "终面"
  | "Offer"
  | "已淘汰"
  | "待确认";

export type CandidateStatus =
  | "待跟进"
  | "已通过"
  | "未通过"
  | "待安排"
  | "待反馈"
  | "已完成";

export type Candidate = {
  id: string;
  name: string;
  position: string;
  school: string | null;
  background: string | null;
  stage: Stage;
  status: CandidateStatus;
  result: string | null;
  feedback: string | null;
  interviewTime: string | null;
  owner: string | null;
  nextAction: string | null;
  aiSummary: string | null;
  confidence: number;
  sourceText: string;
  createdAt: string;
  updatedAt: string;
};

export type ExtractedCandidate = {
  name: string;
  position: string;
  school: string | null;
  background: string | null;
  stage: Stage;
  status: CandidateStatus;
  result: string | null;
  feedback: string | null;
  interviewTime: string | null;
  owner: string | null;
  nextAction: string | null;
  aiSummary: string | null;
  confidence: number;
};

export type ExtractionResult = {
  candidates: ExtractedCandidate[];
};

export type Metric = {
  label: string;
  value: number;
  helper: string;
};

export type ChartDatum = {
  name: string;
  value: number;
};

export type RecentUpdate = {
  id: string;
  name: string;
  position: string;
  stage: Stage;
  status: CandidateStatus;
  updatedAt: string;
};

export type DashboardData = {
  metrics: {
    total: number;
    todayNew: number;
    pendingFollowUp: number;
    passed: number;
  };
  funnel: ChartDatum[];
  positions: ChartDatum[];
  recentUpdates: RecentUpdate[];
  dailySummary: string;
};

export type DailyReport = {
  date: string;
  summary: string;
  highlights: string[];
  todos: string[];
  risks: string[];
};
