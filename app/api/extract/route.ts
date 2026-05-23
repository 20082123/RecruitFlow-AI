import { NextResponse } from "next/server";
import { extractRecruitingData } from "@/lib/extractor";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    rawText?: unknown;
  } | null;
  const rawText = typeof body?.rawText === "string" ? body.rawText.trim() : "";

  if (!rawText) {
    return NextResponse.json(
      { error: "rawText is required" },
      { status: 400 }
    );
  }

  const result = await extractRecruitingData(rawText);

  return NextResponse.json(result);
}
