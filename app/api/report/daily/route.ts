import { NextResponse } from "next/server";
import { buildDailyReport } from "@/lib/report";
import { getCandidates } from "@/lib/store";

export async function POST() {
  const candidates = await getCandidates();
  const report = buildDailyReport(candidates);

  return NextResponse.json(report);
}
