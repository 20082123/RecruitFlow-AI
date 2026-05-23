import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dataFile = path.join(root, "data", "candidates.json");
const baseUrl = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3217";

const originalData = await readFile(dataFile, "utf8").catch(() => "[]");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function waitForServer() {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 30000) {
    try {
      const response = await fetch(`${baseUrl}/api/dashboard`);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error("Timed out waiting for dev server");
}

async function extract(rawText) {
  const response = await fetch(`${baseUrl}/api/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rawText })
  });

  assert(response.ok, `extract failed with ${response.status}`);
  return response.json();
}

async function postCandidate(candidate) {
  const response = await fetch(`${baseUrl}/api/candidates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sourceText: "normalization smoke test",
      candidates: [candidate]
    })
  });

  assert(response.ok, `candidate insert failed with ${response.status}`);
  return response.json();
}

try {
  await writeFile(dataFile, "[]", "utf8");
  await waitForServer();

  const case1 = await extract(`候选人黄磊，投递 AI 应用工程师，硕士，做过 LangChain、知识库问答和数据分析项目。
面试官-周老师：黄磊技术匹配度较高，建议优先推进，安排一面。
HR-小陈：收到，黄磊状态更新为待安排一面。`);
  assert(case1.candidates.length === 1, "case1 should extract one candidate");
  assert(case1.candidates[0].name === "黄磊", "case1 name should be 黄磊");
  assert(
    case1.candidates[0].position === "AI 应用工程师",
    "case1 position should be normalized"
  );
  assert(case1.candidates[0].stage === "一面", "case1 stage should be 一面");
  assert(case1.candidates[0].status === "待安排", "case1 status should be 待安排");
  assert(case1.candidates[0].owner === "周老师", "case1 owner should be 周老师");

  const case2 = await extract(`HR-小刘：还有一个赵强，岗位好像也是 AI 相关，但简历信息不太完整。
面试官-周老师：这个先放一下，学校和项目经历都没看清楚，需要 HR 再补充资料。`);
  assert(case2.candidates.length === 1, "case2 should extract one candidate");
  assert(case2.candidates[0].name === "赵强", "case2 name should be 赵强");
  assert(case2.candidates[0].position === "待确认", "case2 position should be 待确认");
  assert(case2.candidates[0].stage === "待确认", "case2 stage should be 待确认");
  assert(
    ["待跟进", "待确认"].includes(case2.candidates[0].status),
    "case2 status should require follow-up"
  );
  assert(case2.candidates[0].confidence < 0.7, "case2 confidence should be low");

  const case3 = await extract(`面试官-李老师：刚才会议纪要我晚点发。
HR-小王：好的。`);
  assert(case3.candidates.length === 0, "case3 should extract no candidates");

  const case4 = await extract(`候选人吴倩，投递管培生，简历里写了学生会和运营实习。
面试官-陈老师：吴倩沟通不错，但 AI 项目经验较弱，可以先待定，看看后面有没有更匹配的人。
HR-小王：吴倩先标记为待确认。`);
  assert(case4.candidates.length === 1, "case4 should extract one candidate");
  assert(case4.candidates[0].name === "吴倩", "case4 name should be 吴倩");
  assert(case4.candidates[0].position === "管培生", "case4 position should be 管培生");
  assert(case4.candidates[0].stage === "待确认", "case4 stage should be 待确认");
  assert(
    ["待跟进", "待确认"].includes(case4.candidates[0].status),
    "case4 status should require confirmation"
  );

  const case5 = await extract(`HR-小王：这是管培生候选人张三的简历，贵州大学电子信息硕士，有 AI 应用项目经验。
面试官-李老师：张三一面整体不错，表达比较清楚，项目经历和岗位有一定匹配，可以进入二面。
HR-小王：收到，我安排他 5 月 24 日下午 2 点二面。
面试官-陈老师：李四不太合适，沟通表达一般，项目经历偏弱，建议淘汰。
HR-小王：好的，李四状态我更新为未通过。`);
  const zhangSan = case5.candidates.find((candidate) => candidate.name === "张三");
  const liSi = case5.candidates.find((candidate) => candidate.name === "李四");
  assert(case5.candidates.length === 2, "case5 should extract two candidates");
  assert(zhangSan, "case5 should extract 张三, not 张三的简");
  assert(zhangSan.position === "管培生", "张三 position should be 管培生");
  assert(zhangSan.stage === "二面", "张三 stage should be 二面");
  assert(zhangSan.status === "待安排", "张三 status should be 待安排");
  assert(zhangSan.interviewTime === "5 月 24 日下午 2 点", "张三 time should be preserved");
  assert(liSi, "case5 should extract 李四");
  assert(liSi.stage === "已淘汰", "李四 stage should be 已淘汰");
  assert(liSi.status === "未通过", "李四 status should be 未通过");

  const case6 = await extract(`王五，一面不错进入二面。
他应聘新媒体运营。
好的安排他6月1号14.00面试。`);
  assert(case6.candidates.length === 1, "case6 should extract one candidate");
  assert(case6.candidates[0].name === "王五", "case6 name should be 王五");
  assert(case6.candidates[0].position === "产品运营", "case6 position should normalize to 产品运营");
  assert(case6.candidates[0].stage === "二面", "case6 stage should be 二面");
  assert(case6.candidates[0].status === "待安排", "case6 status should be 待安排");
  assert(case6.candidates[0].interviewTime === "6月1号14.00", "case6 time should be preserved");

  const case7 = await extract(`候选人唐悦，投递产品运营，二面通过。
建议进入终面，终面时间下周一下午再定。`);
  assert(case7.candidates.length === 1, "case7 should not extract 建议进入 as a candidate");
  assert(case7.candidates[0].name === "唐悦", "case7 name should be 唐悦");
  assert(case7.candidates[0].position === "产品运营", "case7 position should be 产品运营");
  assert(case7.candidates[0].stage === "终面", "case7 stage should be 终面");
  assert(case7.candidates[0].status === "待安排", "case7 status should be 待安排");

  const beforeDashboardResponse = await fetch(`${baseUrl}/api/dashboard`);
  assert(beforeDashboardResponse.ok, "initial dashboard request should succeed");
  const beforeDashboard = await beforeDashboardResponse.json();
  const beforeAiPosition = beforeDashboard.positions.find(
    (item) => item.name === "AI 应用工程师"
  );
  const beforeAiCount = beforeAiPosition?.value ?? 0;

  await postCandidate({
    name: "归一化测试",
    position: "AI应用工程师",
    stage: "一面",
    status: "待安排",
    confidence: 0.9
  });

  const dashboardResponse = await fetch(`${baseUrl}/api/dashboard`);
  assert(dashboardResponse.ok, "dashboard request should succeed");
  const dashboard = await dashboardResponse.json();
  const aiPosition = dashboard.positions.find(
    (item) => item.name === "AI 应用工程师"
  );
  assert(
    aiPosition?.value === beforeAiCount + 1,
    "dashboard should count normalized AI 应用工程师"
  );

  console.log("mock extractor and normalization smoke test passed");
} finally {
  await writeFile(dataFile, originalData, "utf8");
}
