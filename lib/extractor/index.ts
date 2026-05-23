import type { ExtractionResult } from "@/lib/types";
import { llmExtractRecruitingData } from "@/lib/extractor/llm-extractor";
import { mockExtractRecruitingData } from "@/lib/extractor/mock-extractor";
import { normalizeExtractionResult } from "@/lib/extractor/schema";

export async function extractRecruitingData(
  rawText: string
): Promise<ExtractionResult> {
  const result = process.env.OPENAI_API_KEY
    ? await llmExtractRecruitingData(rawText)
    : await mockExtractRecruitingData(rawText);

  return normalizeExtractionResult(result);
}
