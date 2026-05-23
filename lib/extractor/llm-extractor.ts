import { extractionSystemPrompt } from "@/lib/extractor/prompt";
import { normalizeExtractionResult } from "@/lib/extractor/schema";
import type { ExtractionResult } from "@/lib/types";

function getEndpoint() {
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  return `${baseUrl.replace(/\/$/, "")}/chat/completions`;
}

function extractJson(text: string) {
  const trimmed = text.trim();

  if (trimmed.startsWith("{")) {
    return trimmed;
  }

  const match = trimmed.match(/\{[\s\S]*\}/);
  return match?.[0] ?? trimmed;
}

export async function llmExtractRecruitingData(
  rawText: string
): Promise<ExtractionResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for LLM extraction");
  }

  const response = await fetch(getEndpoint(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: extractionSystemPrompt
        },
        {
          role: "user",
          content: rawText
        }
      ],
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`LLM extraction failed: ${response.status} ${message}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("LLM extraction returned empty content");
  }

  return normalizeExtractionResult(JSON.parse(extractJson(content)));
}
