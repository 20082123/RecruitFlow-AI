import { getCandidates } from "@/lib/store";
import type { Candidate } from "@/lib/types";

const headers: Array<keyof Candidate> = [
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
  "updatedAt"
];

function escapeCsv(value: unknown) {
  const text = value == null ? "" : String(value);

  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export async function GET() {
  const candidates = await getCandidates();
  const csv = [
    headers.join(","),
    ...candidates.map((candidate) =>
      headers.map((header) => escapeCsv(candidate[header])).join(",")
    )
  ].join("\n");

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="recruitflow-candidates.csv"'
    }
  });
}
