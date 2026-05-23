import type { ExtractedCandidate, ExtractionResult } from "@/lib/types";
import { normalizeExtractedCandidate } from "@/lib/extractor/schema";
import { normalizePosition } from "@/lib/normalization";

const explicitNamePatterns = [
  /候选人[:：\s]?([\u4e00-\u9fa5]{2,4}?)(?=的|，|,|。|\s|$)/g,
  /这是[^，。\n]{0,16}候选人([\u4e00-\u9fa5]{2,4}?)(?=的|，|,|。|\s|$)/g,
  /今天新增一个候选人([\u4e00-\u9fa5]{2,4}?)(?=的|，|,|。|\s|$)/g,
  /还有一个([\u4e00-\u9fa5]{2,4}?)(?=的|，|,|。|\s|$)/g,
  /(?:^|[\n。])\s*([\u4e00-\u9fa5]{2,4})[，,]\s*(?:投递|应聘)[^，。\n]{0,24}/g,
  /(?:^|[\n。])\s*([\u4e00-\u9fa5]{2,4})[，,]\s*(?:一面|二面|终面|简历|沟通|表达|技术|状态|不太合适|不合适|未通过|待确认)/g,
  /(?:^|[\n。])\s*([\u4e00-\u9fa5]{2,4})[，,]\s*(?:管培生|AI\s*应用工程师|测试工程师|产品运营)/g
];

const contextualNamePatterns = [
  /(?:^|[：:\n])\s*([\u4e00-\u9fa5]{2,4}?)(?=一面|二面|终面|状态|不太合适|不合适|未通过|沟通|整体|简历筛选|简历可以|技术匹配|表达)/g
];

const blockedNames = new Set([
  "可以进入",
  "待安排",
  "安排",
  "下一步",
  "一步安排",
  "建议进入",
  "收到",
  "好的",
  "通过",
  "不通过",
  "未通过",
  "待确认",
  "面试官",
  "简历",
  "岗位",
  "项目",
  "反馈",
  "负责人",
  "会议纪要"
]);

function isValidName(name: string) {
  return /^[\u4e00-\u9fa5]{2,4}$/.test(name) && !blockedNames.has(name);
}

function uniqueNames(rawText: string) {
  const names = new Set<string>();

  for (const pattern of [...explicitNamePatterns, ...contextualNamePatterns]) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(rawText)) !== null) {
      const name = match[1].trim();
      if (isValidName(name)) {
        names.add(name);
      }
    }
  }

  return Array.from(names);
}

function hasOtherCandidateStart(line: string, currentName: string) {
  const names = uniqueNames(line);
  return names.some((name) => name !== currentName);
}

function hasOtherKnownName(line: string, currentName: string, allNames: string[]) {
  return allNames.some((name) => name !== currentName && line.includes(name));
}

function buildContext(rawText: string, name: string, allNames: string[]) {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const start = lines.findIndex((line) => line.includes(name));

  if (start === -1) {
    return rawText;
  }

  const contextLines: string[] = [];

  for (let index = start; index < lines.length && index < start + 5; index += 1) {
    const line = lines[index];

    if (
      index > start &&
      (hasOtherCandidateStart(line, name) || hasOtherKnownName(line, name, allNames))
    ) {
      break;
    }

    contextLines.push(line);
  }

  return contextLines.join("\n");
}

function findPosition(context: string, name: string) {
  const patterns = [
    new RegExp(`这是([^，。\\n]{2,20}?)候选人${name}`),
    /投递\s*([^，。,\n]{2,20}?)(?:岗位|，|,|。|$)/,
    /应聘\s*([^，。,\n]{2,20}?)(?:岗位|，|,|。|$)/,
    /他应聘\s*([^，。,\n]{2,20}?)(?:岗位|，|,|。|$)/,
    /她应聘\s*([^，。,\n]{2,20}?)(?:岗位|，|,|。|$)/,
    new RegExp(`${name}[，,]\\s*([^，。,\n]{2,20}?)(?:岗位|，|,|。|$)`),
    /岗位好像也是\s*([^，。,\n]{2,20}?)(?:，|,|。|$)/
  ];

  for (const pattern of patterns) {
    const match = context.match(pattern);
    if (match?.[1]) {
      return normalizePosition(match[1].replace(/岗位$/, ""));
    }
  }

  if (/AI\s*相关|AI相关|岗位.*不.*明确/.test(context)) return "待确认";
  if (/AI\s*应用工程师|AI应用工程师|LangChain|RAG|FastAPI/.test(context)) {
    return "AI 应用工程师";
  }
  if (/测试工程师|自动化测试|接口测试|性能测试/.test(context)) return "测试工程师";
  if (/产品运营|用户增长|社群增长/.test(context)) return "产品运营";
  if (/管培生|管培/.test(context)) return "管培生";

  return "待确认";
}

function findSchool(context: string) {
  const match = context.match(/([\u4e00-\u9fa5]{2,12}(?:大学|学院))/);
  return match?.[1] ?? null;
}

function findOwner(context: string) {
  const explicit = context.match(/(?:负责人是|面试官是)([\u4e00-\u9fa5]{1,3}老师)/);
  if (explicit?.[1]) return explicit[1];

  const speaker = context.match(/面试官-([\u4e00-\u9fa5]{1,3}老师)：/);
  return speaker?.[1] ?? null;
}

function findInterviewTime(context: string) {
  const match = context.match(
    /(\d{1,2}\s*月\s*\d{1,2}\s*(?:日|号)?\s*(?:上午|下午|晚上)?\s*\d{1,2}\s*(?:点|[.:：]\s*\d{1,2})(?:\s*\d{1,2}\s*分?)?)/
  );

  return match?.[1]?.replace(/\s+/g, " ").replace(/\s*([.:：])\s*/g, "$1") ?? null;
}

function inferStageAndStatus(context: string): Pick<ExtractedCandidate, "stage" | "status"> {
  if (/淘汰|不合适|不太合适|未通过|不通过/.test(context)) {
    return { stage: "已淘汰", status: "未通过" };
  }

  if (/待确认|先待定|信息不完整|补充资料|没看清楚|先放一下/.test(context)) {
    return { stage: "待确认", status: "待跟进" };
  }

  if (/待反馈|没有给最终反馈/.test(context)) {
    return { stage: /二面/.test(context) ? "二面" : "一面", status: "待反馈" };
  }

  if (/进入三面|安排三面|待安排三面/.test(context)) {
    return { stage: "终面", status: "待安排" };
  }

  if (/进入终面|安排终面|终面时间|待安排终面/.test(context)) {
    return { stage: "终面", status: "待安排" };
  }

  if (/二面通过/.test(context)) {
    return { stage: "二面", status: "已通过" };
  }

  if (/终面/.test(context)) {
    return { stage: "终面", status: /通过/.test(context) ? "已通过" : "待安排" };
  }

  if (/进入二面|安排二面|待安排二面/.test(context)) {
    return { stage: "二面", status: "待安排" };
  }

  if (/一面通过|过一面|可以过一面|可以进入二面/.test(context)) {
    return { stage: "一面", status: "已通过" };
  }

  if (/待安排一面|安排一面|约一面|先约一面/.test(context)) {
    return { stage: "一面", status: "待安排" };
  }

  if (/简历筛选通过|简历通过|筛选通过|简历可以/.test(context)) {
    return { stage: "简历筛选", status: "已通过" };
  }

  return { stage: "待确认", status: "待跟进" };
}

function inferFeedback(context: string) {
  const feedbackMatch = context.match(/(?:反馈是|原因是)([^。\n]+)/);
  if (feedbackMatch?.[1]) {
    return feedbackMatch[1].trim();
  }

  const interviewerLine = context
    .split(/\r?\n/)
    .find((line) => line.startsWith("面试官-"));

  if (!interviewerLine) return null;

  return interviewerLine
    .replace(/^面试官-[^：]+：/, "")
    .replace(/建议.*$/, "")
    .trim();
}

function inferNextAction(
  context: string,
  stage: ExtractedCandidate["stage"],
  status: ExtractedCandidate["status"]
) {
  if (status === "未通过") return "同步未通过状态并归档";
  if (/补充资料|信息不完整|没看清楚/.test(context)) return "补充候选人资料";
  if (status === "待反馈") return "提醒面试官补充反馈";
  if (stage === "二面" && status === "待安排") return "安排二面";
  if (stage === "一面" && status === "待安排") return "安排一面";
  if (stage === "终面") return "安排终面";
  if (stage === "待确认") return "HR 复核候选人信息";
  return "HR 继续跟进";
}

function inferConfidence(
  position: string,
  stage: ExtractedCandidate["stage"],
  status: ExtractedCandidate["status"]
) {
  if (position === "待确认" || stage === "待确认") return 0.58;
  if (position === "其他" || status === "待跟进") return 0.66;
  return 0.86;
}

function buildCandidate(rawText: string, name: string, allNames: string[]): ExtractedCandidate {
  const context = buildContext(rawText, name, allNames);
  const position = findPosition(context, name);
  const school = findSchool(context);
  const { stage, status } = inferStageAndStatus(context);
  const nextAction = inferNextAction(context, stage, status);

  return normalizeExtractedCandidate({
    name,
    position,
    school,
    background: school ? context.replace(school, "").slice(0, 80) : null,
    stage,
    status,
    result: status === "未通过" ? "未通过" : status === "已通过" ? "通过" : null,
    feedback: inferFeedback(context),
    interviewTime: findInterviewTime(context),
    owner: findOwner(context),
    nextAction,
    aiSummary: `${name} 当前处于${stage}阶段，状态为${status}。${nextAction}`,
    confidence: inferConfidence(position, stage, status)
  });
}

export async function mockExtractRecruitingData(
  rawText: string
): Promise<ExtractionResult> {
  const names = uniqueNames(rawText);

  return {
    candidates: names.map((name) => buildCandidate(rawText, name, names))
  };
}
