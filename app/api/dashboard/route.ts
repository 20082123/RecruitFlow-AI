import { NextResponse } from "next/server";
import { buildDashboardData } from "@/lib/dashboard";
import { getCandidates } from "@/lib/store";

export async function GET() {
  const candidates = await getCandidates();
  const dashboard = buildDashboardData(candidates);

  return NextResponse.json(dashboard);
}
