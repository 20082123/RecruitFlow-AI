"use client";

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import type { DailyReport } from "@/lib/types";

type ReportState = "idle" | "loading" | "success" | "error";

function ReportList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl bg-white p-4">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ocean" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DailyReportCard() {
  const [report, setReport] = useState<DailyReport | null>(null);
  const [state, setState] = useState<ReportState>("idle");
  const [message, setMessage] = useState("");

  async function handleGenerate() {
    setState("loading");
    setMessage("");

    try {
      const response = await fetch("/api/report/daily", {
        method: "POST"
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "日报生成失败");
      }

      setReport(payload);
      setState("success");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "日报生成失败");
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean">
            Daily Recruiting Brief
          </p>
          <h2 className="mt-1 text-lg font-semibold text-ink">AI 招聘日报</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            基于当前候选人数据生成今日摘要、重点进展、待办和数据风险。
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={state === "loading"}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ocean disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          生成今日日报
        </button>
      </div>

      {message && <p className="mt-4 text-sm font-medium text-rose-600">{message}</p>}

      {report && (
        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-ocean/15 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-ink">{report.date}</h3>
              <span className="rounded-full bg-ocean/10 px-2.5 py-1 text-xs font-semibold text-ocean">
                规则生成
              </span>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              {report.summary}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <ReportList title="重点进展" items={report.highlights} />
            <ReportList title="待办事项" items={report.todos} />
            <ReportList title="风险提示" items={report.risks} />
          </div>
        </div>
      )}
    </section>
  );
}
