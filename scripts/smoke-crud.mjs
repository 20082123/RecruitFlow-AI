const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(path, options) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  return { response, body };
}

const uniqueName = `测试候选人-${crypto.randomUUID().slice(0, 8)}`;

const initial = await request("/api/candidates");
assert(initial.response.ok, "GET /api/candidates should return 200");
assert(initial.body.candidates.length > 0, "seeded candidates should exist");

const created = await request("/api/candidates", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    sourceText: `HR-小王：${uniqueName} 投递测试工程师，待安排一面。`,
    candidates: [
      {
        name: uniqueName,
        position: "测试工程师",
        school: "测试大学",
        background: "接口测试和自动化测试",
        stage: "简历筛选",
        status: "待安排",
        result: null,
        feedback: "初筛通过",
        interviewTime: null,
        owner: "HR-小王",
        nextAction: "发送一面邀约",
        aiSummary: "测试候选人初筛通过，等待安排一面。",
        confidence: 0.8
      }
    ]
  })
});

assert(created.response.status === 201, "POST /api/candidates should create");
const candidateId = created.body.upserted[0].id;
assert(candidateId, "created candidate should include id");

const updated = await request(`/api/candidates/${candidateId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    status: "已通过",
    stage: "一面",
    nextAction: "安排二面"
  })
});

assert(updated.response.ok, "PATCH /api/candidates/:id should return 200");
assert(updated.body.candidate.status === "已通过", "PATCH should update status");

const csvResponse = await fetch(`${baseUrl}/api/export/csv`);
const csvBytes = new Uint8Array(await csvResponse.arrayBuffer());
const csvText = new TextDecoder("utf-8").decode(csvBytes);
assert(csvResponse.ok, "CSV export should return 200");
assert(
  csvBytes[0] === 0xef && csvBytes[1] === 0xbb && csvBytes[2] === 0xbf,
  "CSV export should include UTF-8 BOM for Excel"
);
assert(csvText.includes("name,position,school"), "CSV export should include headers");

const json = await request("/api/export/json");
assert(json.response.ok, "JSON export should return 200");
assert(json.body.candidates.length > 0, "JSON export should include candidates");

const deleted = await request(`/api/candidates/${candidateId}`, {
  method: "DELETE"
});

assert(deleted.response.ok, "DELETE /api/candidates/:id should return 200");
assert(deleted.body.ok === true, "DELETE should return ok=true");

console.log(`CRUD smoke passed for ${uniqueName}`);
