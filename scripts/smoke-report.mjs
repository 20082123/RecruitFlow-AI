const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const response = await fetch(`${baseUrl}/api/report/daily`, {
  method: "POST"
});

assert(response.ok, "POST /api/report/daily should return 200");

const report = await response.json();

assert(typeof report.date === "string", "report.date should be a string");
assert(typeof report.summary === "string", "report.summary should be a string");
assert(Array.isArray(report.highlights), "report.highlights should be an array");
assert(Array.isArray(report.todos), "report.todos should be an array");
assert(Array.isArray(report.risks), "report.risks should be an array");
assert(report.summary.includes("候选人"), "report.summary should mention candidates");

console.log(`Daily report smoke passed for ${report.date}`);
