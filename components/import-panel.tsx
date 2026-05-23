"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Loader2, Send, Sparkles } from "lucide-react";
import { STAGE_TONE, STATUS_TONE } from "@/lib/constants";
import type { ExtractedCandidate } from "@/lib/types";
import { cn } from "@/lib/utils";

const sampleText = `HR-小王：这是管培生候选人张三的简历，贵州大学电子信息硕士，有 AI 应用项目经验。
面试官-李老师：张三一面整体不错，表达比较清楚，项目经历和岗位有一定匹配，可以进入二面。
HR-小王：收到，我安排他 5 月 24 日下午 2 点二面。
面试官-陈老师：李四不太合适，沟通表达一般，项目经历偏弱，建议淘汰。
HR-小王：好的，李四状态我更新为未通过。`;

type RequestState = "idle" | "loading" | "success" | "error";

export function ImportPanel() {
  const [rawText, setRawText] = useState(sampleText);
  const [candidates, setCandidates] = useState<ExtractedCandidate[]>([]);
  const [parseState, setParseState] = useState<RequestState>("idle");
  const [saveState, setSaveState] = useState<RequestState>("idle");
  const [message, setMessage] = useState("");

  const canSave = useMemo(
    () => candidates.length > 0 && parseState === "success",
    [candidates.length, parseState]
  );

  async function handleExtract() {
    setParseState("loading");
    setSaveState("idle");
    setMessage("");

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "AI 解析失败");
      }

      setCandidates(payload.candidates ?? []);
      setParseState("success");
      setMessage(`已解析 ${payload.candidates?.length ?? 0} 位候选人。`);
    } catch (error) {
      setCandidates([]);
      setParseState("error");
      setMessage(error instanceof Error ? error.message : "AI 解析失败");
    }
  }

  async function handleSave() {
    setSaveState("loading");
    setMessage("");

    try {
      const response = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceText: rawText,
          candidates
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "入库失败");
      }

      setSaveState("success");
      setMessage(`已确认入库 ${payload.upserted?.length ?? candidates.length} 条记录。`);
    } catch (error) {
      setSaveState("error");
      setMessage(error instanceof Error ? error.message : "入库失败");
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">群聊文本导入</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              粘贴模拟企业微信群聊记录，系统会输出符合 schema 的结构化 JSON。
            </p>
          </div>
          <span className="rounded-full bg-ocean/10 px-3 py-1 text-xs font-semibold text-ocean">
            {process.env.NEXT_PUBLIC_EXTRACTOR_MODE ?? "Mock / API"}
          </span>
        </div>

        <textarea
          value={rawText}
          onChange={(event) => setRawText(event.target.value)}
          className="mt-5 h-[360px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700 outline-none transition focus:border-ocean focus:bg-white focus:ring-2 focus:ring-ocean/15"
          placeholder="粘贴企业微信群聊文本..."
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExtract}
            disabled={parseState === "loading"}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ocean disabled:cursor-not-allowed disabled:opacity-60"
          >
            {parseState === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            AI 解析
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || saveState === "loading"}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-mint px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saveState === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            确认入库
          </button>
          {message && (
            <span
              className={cn(
                "text-sm font-medium",
                parseState === "error" || saveState === "error"
                  ? "text-rose-600"
                  : "text-ocean"
              )}
            >
              {message}
            </span>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">解析结果预览</h2>
            <p className="mt-2 text-sm text-slate-500">
              确认后会写入本地候选人数据，并按姓名 + 岗位合并更新。
            </p>
          </div>
          <Send className="h-5 w-5 text-ocean" />
        </div>

        {candidates.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            解析结果会显示在这里。
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {candidates.map((candidate, index) => (
              <article
                key={`${candidate.name}-${candidate.position}-${index}`}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-ink">
                      {candidate.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {candidate.position} / {candidate.school ?? "学校待补充"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                        STAGE_TONE[candidate.stage]
                      )}
                    >
                      {candidate.stage}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                        STATUS_TONE[candidate.status]
                      )}
                    >
                      {candidate.status}
                    </span>
                  </div>
                </div>

                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-slate-400">反馈原因</dt>
                    <dd className="mt-1 text-slate-700">
                      {candidate.feedback ?? "原文未明确"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400">下一步</dt>
                    <dd className="mt-1 text-slate-700">
                      {candidate.nextAction ?? "待 HR 确认"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400">面试时间</dt>
                    <dd className="mt-1 text-slate-700">
                      {candidate.interviewTime ?? "未提及"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400">置信度</dt>
                    <dd className="mt-1 text-slate-700">
                      {Math.round(candidate.confidence * 100)}%
                    </dd>
                  </div>
                </dl>

                <pre className="mt-4 max-h-56 overflow-auto rounded-lg bg-ink p-3 text-xs leading-5 text-slate-100">
                  {JSON.stringify(candidate, null, 2)}
                </pre>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
