import { NextResponse } from "next/server";
import { getCandidates } from "@/lib/store";

export async function GET() {
  const candidates = await getCandidates();

  return NextResponse.json(
    { candidates },
    {
      headers: {
        "Content-Disposition":
          'attachment; filename="recruitflow-candidates.json"'
      }
    }
  );
}
