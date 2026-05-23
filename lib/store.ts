import { promises as fs } from "fs";
import path from "path";
import { mockCandidates } from "@/lib/mock-data";
import { normalizeCandidate } from "@/lib/normalization";
import type { Candidate, ExtractedCandidate } from "@/lib/types";

const dataFile = path.join(process.cwd(), "data", "candidates.json");

async function readCandidatesFile(): Promise<Candidate[] | null> {
  try {
    const content = await fs.readFile(dataFile, "utf8");

    if (content.trim().length === 0) {
      return null;
    }

    const parsed = JSON.parse(content) as Candidate[];

    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export async function getCandidates(): Promise<Candidate[]> {
  const candidates = [...((await readCandidatesFile()) ?? mockCandidates)].map(
    (candidate) => normalizeCandidate(candidate)
  );

  return candidates.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function saveCandidates(candidates: Candidate[]) {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  const tempFile = `${dataFile}.tmp`;

  await fs.writeFile(tempFile, JSON.stringify(candidates, null, 2), "utf8");
  await fs.rename(tempFile, dataFile);
}

function candidateKey(candidate: Pick<Candidate, "name" | "position">) {
  return `${candidate.name.trim()}::${candidate.position.trim()}`;
}

function toCandidate(
  candidate: ExtractedCandidate,
  sourceText: string,
  existing?: Candidate
): Candidate {
  const now = new Date().toISOString();

  return normalizeCandidate({
    id: existing?.id ?? crypto.randomUUID(),
    ...existing,
    ...candidate,
    sourceText,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  });
}

export async function upsertExtractedCandidates(
  extractedCandidates: ExtractedCandidate[],
  sourceText: string
) {
  const existingCandidates = await getCandidates();
  const candidateMap = new Map(
    existingCandidates.map((candidate) => [candidateKey(candidate), candidate])
  );

  const upserted = extractedCandidates.map((candidate) => {
    const key = candidateKey(candidate);
    const merged = toCandidate(candidate, sourceText, candidateMap.get(key));
    candidateMap.set(key, merged);
    return merged;
  });

  const mergedCandidates = Array.from(candidateMap.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  await saveCandidates(mergedCandidates);

  return {
    candidates: mergedCandidates,
    upserted
  };
}

export async function updateCandidate(
  id: string,
  patch: Partial<Omit<Candidate, "id" | "createdAt" | "updatedAt">>
) {
  const candidates = await getCandidates();
  const index = candidates.findIndex((candidate) => candidate.id === id);

  if (index === -1) {
    return null;
  }

  const updated: Candidate = normalizeCandidate({
    ...candidates[index],
    ...patch,
    id,
    createdAt: candidates[index].createdAt,
    updatedAt: new Date().toISOString()
  });

  candidates[index] = updated;
  await saveCandidates(candidates);

  return updated;
}

export async function deleteCandidate(id: string) {
  const candidates = await getCandidates();
  const nextCandidates = candidates.filter((candidate) => candidate.id !== id);

  if (nextCandidates.length === candidates.length) {
    return false;
  }

  await saveCandidates(nextCandidates);
  return true;
}
