"use client";

import { useMemo, useState } from "react";
import {
  Download,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  X
} from "lucide-react";
import {
  POSITIONS,
  STAGES,
  STATUSES,
  STAGE_TONE,
  STATUS_TONE
} from "@/lib/constants";
import type { Candidate, CandidateStatus, Stage } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";

type CandidateTableProps = {
  candidates: Candidate[];
};

type CandidateFormState = {
  id?: string;
  name: string;
  position: string;
  school: string;
  background: string;
  stage: Stage;
  status: CandidateStatus;
  result: string;
  feedback: string;
  interviewTime: string;
  owner: string;
  nextAction: string;
  aiSummary: string;
  confidence: number;
  sourceText: string;
};

const emptyForm: CandidateFormState = {
  name: "",
  position: POSITIONS[0],
  school: "",
  background: "",
  stage: "简历筛选",
  status: "待安排",
  result: "",
  feedback: "",
  interviewTime: "",
  owner: "",
  nextAction: "",
  aiSummary: "",
  confidence: 0.75,
  sourceText: "HR 手动新增候选人记录。"
};

function toForm(candidate: Candidate): CandidateFormState {
  return {
    id: candidate.id,
    name: candidate.name,
    position: candidate.position,
    school: candidate.school ?? "",
    background: candidate.background ?? "",
    stage: candidate.stage,
    status: candidate.status,
    result: candidate.result ?? "",
    feedback: candidate.feedback ?? "",
    interviewTime: candidate.interviewTime ?? "",
    owner: candidate.owner ?? "",
    nextAction: candidate.nextAction ?? "",
    aiSummary: candidate.aiSummary ?? "",
    confidence: candidate.confidence,
    sourceText: candidate.sourceText
  };
}

function toNullable(value: string) {
  return value.trim().length > 0 ? value.trim() : null;
}

function formToExtractedCandidate(form: CandidateFormState) {
  return {
    name: form.name.trim(),
    position: form.position.trim(),
    school: toNullable(form.school),
    background: toNullable(form.background),
    stage: form.stage,
    status: form.status,
    result: toNullable(form.result),
    feedback: toNullable(form.feedback),
    interviewTime: toNullable(form.interviewTime),
    owner: toNullable(form.owner),
    nextAction: toNullable(form.nextAction),
    aiSummary: toNullable(form.aiSummary),
    confidence: form.confidence
  };
}

export function CandidateTable({ candidates }: CandidateTableProps) {
  const [rows, setRows] = useState(candidates);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState("全部岗位");
  const [stage, setStage] = useState("全部阶段");
  const [status, setStatus] = useState("全部状态");
  const [form, setForm] = useState<CandidateFormState | null>(null);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const filteredCandidates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rows.filter((candidate) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          candidate.name,
          candidate.position,
          candidate.school,
          candidate.background,
          candidate.owner,
          candidate.aiSummary
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalizedQuery));

      return (
        matchesQuery &&
        (position === "全部岗位" || candidate.position === position) &&
        (stage === "全部阶段" || candidate.stage === stage) &&
        (status === "全部状态" || candidate.status === status)
      );
    });
  }, [position, query, rows, stage, status]);

  async function refreshRows() {
    const response = await fetch("/api/candidates", { cache: "no-store" });
    const payload = await response.json();
    setRows(payload.candidates ?? []);
  }

  async function handleQuickStatus(candidate: Candidate, nextStatus: string) {
    const response = await fetch(`/api/candidates/${candidate.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    });

    if (!response.ok) {
      setMessage("状态更新失败，请稍后重试。");
      return;
    }

    const payload = await response.json();
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === candidate.id ? payload.candidate : row
      )
    );
    setMessage(`${candidate.name} 状态已更新为 ${nextStatus}`);
  }

  async function handleDelete(candidate: Candidate) {
    if (!window.confirm(`确认删除 ${candidate.name} 的候选人记录？`)) {
      return;
    }

    const response = await fetch(`/api/candidates/${candidate.id}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      setMessage("删除失败，请稍后重试。");
      return;
    }

    setRows((currentRows) =>
      currentRows.filter((row) => row.id !== candidate.id)
    );
    setMessage(`${candidate.name} 已删除`);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form || !form.name.trim()) {
      setMessage("请填写候选人姓名。");
      return;
    }

    setIsSaving(true);
    setMessage("");

    const payload = formToExtractedCandidate(form);

    try {
      if (form.id) {
        const response = await fetch(`/api/candidates/${form.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            sourceText: form.sourceText
          })
        });

        if (!response.ok) {
          throw new Error("编辑失败");
        }

        const result = await response.json();
        setRows((currentRows) =>
          currentRows.map((row) =>
            row.id === form.id ? result.candidate : row
          )
        );
        setMessage("候选人信息已更新。");
      } else {
        const response = await fetch("/api/candidates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceText: form.sourceText,
            candidates: [payload]
          })
        });

        if (!response.ok) {
          throw new Error("新增失败");
        }

        await refreshRows();
        setMessage("候选人已新增。");
      }

      setForm(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-panel">
      <div className="border-b border-slate-200 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">候选人列表</h2>
            <p className="mt-1 text-sm text-slate-500">
              共 {filteredCandidates.length} 条记录，支持搜索、筛选、编辑和导出
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setForm(emptyForm)}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ocean"
            >
              <Plus className="h-4 w-4" />
              新增候选人
            </button>
            <a
              href="/api/export/csv"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:border-ocean hover:text-ocean"
            >
              <Download className="h-4 w-4" />
              CSV
            </a>
            <a
              href="/api/export/json"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:border-ocean hover:text-ocean"
            >
              <Download className="h-4 w-4" />
              JSON
            </a>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[260px_150px_150px_150px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索姓名、岗位、负责人"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/15"
            />
          </label>
          <select
            value={position}
            onChange={(event) => setPosition(event.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
          >
            <option>全部岗位</option>
            {POSITIONS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            value={stage}
            onChange={(event) => setStage(event.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
          >
            <option>全部阶段</option>
            {STAGES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
          >
            <option>全部状态</option>
            {STATUSES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>

        {message && <p className="mt-3 text-sm font-medium text-ocean">{message}</p>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3 font-semibold">候选人</th>
              <th className="px-5 py-3 font-semibold">岗位</th>
              <th className="px-5 py-3 font-semibold">阶段</th>
              <th className="px-5 py-3 font-semibold">状态</th>
              <th className="px-5 py-3 font-semibold">面试时间</th>
              <th className="px-5 py-3 font-semibold">负责人</th>
              <th className="px-5 py-3 font-semibold">置信度</th>
              <th className="px-5 py-3 font-semibold">AI 摘要</th>
              <th className="px-5 py-3 font-semibold">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCandidates.map((candidate) => (
              <tr key={candidate.id} className="align-top transition hover:bg-slate-50">
                <td className="px-5 py-4">
                  <div className="font-semibold text-ink">{candidate.name}</div>
                  <div className="mt-1 max-w-48 truncate text-xs text-slate-500">
                    {candidate.school ?? candidate.background ?? "背景待补充"}
                  </div>
                </td>
                <td className="px-5 py-4 text-slate-700">{candidate.position}</td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                      STAGE_TONE[candidate.stage]
                    )}
                  >
                    {candidate.stage}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <select
                    value={candidate.status}
                    onChange={(event) =>
                      handleQuickStatus(candidate, event.target.value)
                    }
                    className={cn(
                      "h-8 rounded-full border-0 px-2.5 text-xs font-semibold outline-none ring-1 ring-transparent focus:ring-ocean/30",
                      STATUS_TONE[candidate.status]
                    )}
                  >
                    {STATUSES.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </td>
                <td className="px-5 py-4 text-slate-600">
                  {formatDateTime(candidate.interviewTime)}
                </td>
                <td className="px-5 py-4 text-slate-600">
                  {candidate.owner ?? "待分配"}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          candidate.confidence < 0.7 ? "bg-amber" : "bg-mint"
                        )}
                        style={{
                          width: `${Math.round(candidate.confidence * 100)}%`
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-600">
                      {Math.round(candidate.confidence * 100)}%
                    </span>
                  </div>
                </td>
                <td className="max-w-sm px-5 py-4 text-slate-600">
                  {candidate.aiSummary ?? "暂无摘要"}
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForm(toForm(candidate))}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-ocean hover:text-ocean"
                      title="编辑候选人"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(candidate)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 text-rose-600 transition hover:bg-rose-50"
                      title="删除候选人"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit}
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-panel"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-ink">
                  {form.id ? "编辑候选人" : "新增候选人"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  这里修改的是本地 Demo 数据，适合模拟 HR 手工修正。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <TextField label="姓名" value={form.name} onChange={(name) => setForm({ ...form, name })} required />
              <SelectField label="岗位" value={form.position} options={POSITIONS} onChange={(value) => setForm({ ...form, position: value })} />
              <TextField label="学校" value={form.school} onChange={(school) => setForm({ ...form, school })} />
              <TextField label="背景" value={form.background} onChange={(background) => setForm({ ...form, background })} />
              <SelectField label="阶段" value={form.stage} options={STAGES} onChange={(value) => setForm({ ...form, stage: value as Stage })} />
              <SelectField label="状态" value={form.status} options={STATUSES} onChange={(value) => setForm({ ...form, status: value as CandidateStatus })} />
              <TextField label="面试时间" value={form.interviewTime} onChange={(interviewTime) => setForm({ ...form, interviewTime })} placeholder="2026-05-24 14:00" />
              <TextField label="负责人" value={form.owner} onChange={(owner) => setForm({ ...form, owner })} />
              <TextField label="结果" value={form.result} onChange={(result) => setForm({ ...form, result })} />
              <TextField label="下一步" value={form.nextAction} onChange={(nextAction) => setForm({ ...form, nextAction })} />
              <TextField label="置信度" type="number" min={0} max={1} step={0.01} value={String(form.confidence)} onChange={(confidence) => setForm({ ...form, confidence: Number(confidence) })} />
              <TextField label="反馈" value={form.feedback} onChange={(feedback) => setForm({ ...form, feedback })} />
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">AI 摘要</span>
              <textarea
                value={form.aiSummary}
                onChange={(event) =>
                  setForm({ ...form, aiSummary: event.target.value })
                }
                className="mt-1 h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
              />
            </label>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setForm(null)}
                className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:text-ink"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white hover:bg-ocean disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                保存
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  required,
  ...props
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        {...props}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
