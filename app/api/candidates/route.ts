import { NextResponse } from "next/server";
import { normalizeExtractionResult } from "@/lib/extractor/schema";
import { getCandidates, upsertExtractedCandidates } from "@/lib/store";

export async function GET() {
  const candidates = await getCandidates();

  return NextResponse.json({ candidates });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    candidates?: unknown;
    sourceText?: unknown;
  } | null;
  const sourceText =
    typeof body?.sourceText === "string" && body.sourceText.trim().length > 0
      ? body.sourceText.trim()
      : "";
  const extraction = normalizeExtractionResult({
    candidates: body?.candidates
  });

  if (!sourceText) {
    return NextResponse.json(
      { error: "sourceText is required" },
      { status: 400 }
    );
  }

  if (extraction.candidates.length === 0) {
    return NextResponse.json(
      { error: "candidates is required" },
      { status: 400 }
    );
  }

  const result = await upsertExtractedCandidates(
    extraction.candidates,
    sourceText
  );

  return NextResponse.json(result, { status: 201 });
}
