import { normalizeExtractedCandidateFields } from "@/lib/normalization";
import type { ExtractedCandidate, ExtractionResult } from "@/lib/types";

export function normalizeExtractedCandidate(
  value: Partial<ExtractedCandidate>
): ExtractedCandidate {
  return normalizeExtractedCandidateFields(value);
}

export function normalizeExtractionResult(value: unknown): ExtractionResult {
  const maybeResult = value as { candidates?: Partial<ExtractedCandidate>[] };
  const candidates = Array.isArray(maybeResult?.candidates)
    ? maybeResult.candidates.map(normalizeExtractedCandidate)
    : [];

  return { candidates };
}
