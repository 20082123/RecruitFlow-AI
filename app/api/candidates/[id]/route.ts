import { NextResponse } from "next/server";
import { STAGES, STATUSES } from "@/lib/constants";
import { deleteCandidate, updateCandidate } from "@/lib/store";
import type { Candidate, CandidateStatus, Stage } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const editableFields = new Set([
  "name",
  "position",
  "school",
  "background",
  "stage",
  "status",
  "result",
  "feedback",
  "interviewTime",
  "owner",
  "nextAction",
  "aiSummary",
  "confidence",
  "sourceText"
]);

function sanitizePatch(body: Record<string, unknown>) {
  const patch: Partial<Omit<Candidate, "id" | "createdAt" | "updatedAt">> = {};

  for (const [key, value] of Object.entries(body)) {
    if (!editableFields.has(key)) {
      continue;
    }

    if (key === "stage" && !STAGES.includes(value as Stage)) {
      continue;
    }

    if (key === "status" && !STATUSES.includes(value as CandidateStatus)) {
      continue;
    }

    if (key === "confidence") {
      const confidence = Number(value);

      if (Number.isFinite(confidence)) {
        patch.confidence = Math.min(1, Math.max(0, confidence));
      }

      continue;
    }

    (patch as Record<string, unknown>)[key] =
      typeof value === "string" && value.trim().length === 0 ? null : value;
  }

  return patch;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const candidate = await updateCandidate(id, sanitizePatch(body));

  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  return NextResponse.json({ candidate });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const ok = await deleteCandidate(id);

  if (!ok) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
