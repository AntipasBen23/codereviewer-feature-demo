export type Severity = "info" | "warning" | "critical";
export type StepStatus = "idle" | "running" | "done" | "error";

export type ReviewComment = {
  id: string;
  filePath: string;
  line: number;
  severity: Severity;
  title: string;
  message: string;
  rationale: string;
  riskScore: number; // 0 - 100
  suggestedPatchId?: string;
};

export type Patch = {
  id: string;
  title: string;
  summary: string;
  unifiedDiff: string;
  touchesBusinessLogic: boolean;
};

export type MemoryHit = {
  id: string;
  source: "style-guide" | "past-pr" | "module-pattern" | "incident-postmortem";
  title: string;
  snippet: string;
};

export type PRScenario = {
  id: string;
  name: string;
  repo: string;
  prNumber: number;
  branch: string;
  author: string;
  languages: string[];
  changedFiles: number;
  additions: number;
  deletions: number;
  ci: { status: "passing" | "failing"; summary: string; logs: string[] };
  diff: { filePath: string; hunks: string[] }[];
  reviewGeneric: { comments: ReviewComment[]; patches: Patch[] };
  reviewWithMemory: { memoryHits: MemoryHit[]; comments: ReviewComment[]; patches: Patch[] };
};

export type PipelineStep = {
  id: string;
  label: string;
  description: string;
};

export const PIPELINE: PipelineStep[] = [
  { id: "ingest", label: "Ingest PR Event", description: "Simulate GitHub webhook → PR metadata captured" },
  { id: "index", label: "Index Repo Context", description: "Collect changed files, key docs, module boundaries" },
  { id: "retrieve", label: "Retrieve Project Memory", description: "Fetch style decisions + prior review patterns (RAG)" },
  { id: "analyze", label: "Run Analyzers", description: "Static signals: lint/test/AST heuristics + diff risk model" },
  { id: "generate", label: "Generate Review + Patches", description: "Comments + patch-ready unified diffs + risk scores" },
  { id: "post", label: "Post Back to PR", description: "Simulate Check Run + review comments + optional bot commit" },
];

export const SCENARIOS: PRScenario[] = [
  {
    id: "s1",
    name: "Payments: safer error handling + test fix",
    repo: "acme/payments-api",
    prNumber: 184,
    branch: "feature/refund-safety-guard",
    author: "samuel",
    languages: ["TypeScript", "Node.js"],
    changedFiles: 3,
    additions: 62,
    deletions: 18,
    ci: {
      status: "failing",
      summary: "1 failing test • 2 lint warnings",
      logs: [
        "FAIL  tests/refunds.spec.ts",
        "  ● refunds › should not double-refund when gateway retries",
        "    Expected: 1, Received: 2",
        "",
        "eslint: warning  no-explicit-any  src/refunds/refund.service.ts:41",
        "eslint: warning  prefer-const      src/refunds/refund.service.ts:19",
      ],
    },
    diff: [
      {
        filePath: "src/refunds/refund.service.ts",
        hunks: [
          `@@ -14,6 +14,22 @@ export async function refundPayment(req: RefundRequest) {
-  const tx = await db.refunds.create({ data: { paymentId: req.paymentId, amount: req.amount } })
-  await gateway.refund(req.paymentId, req.amount)
-  return { ok: true, refundId: tx.id }
+  const tx = await db.refunds.create({ data: { paymentId: req.paymentId, amount: req.amount } })
+  await gateway.refund(req.paymentId, req.amount)
+  return { ok: true, refundId: tx.id }
 }`,
          `@@ -35,7 +51,16 @@ export async function refundPayment(req: RefundRequest) {
-  const existing = await db.refunds.findFirst({ where: { paymentId: req.paymentId } })
+  const existing: any = await db.refunds.findFirst({ where: { paymentId: req.paymentId } })
   if (existing) {
     return { ok: true, refundId: existing.id }
   }
+
+  // TODO: handle gateway retry semantics properly
+  // NOTE: gateway may retry, ensure idempotency
`,
        ],
      },
      {
        filePath: "tests/refunds.spec.ts",
        hunks: [
          `@@ -22,7 +22,7 @@ it("should not double-refund when gateway retries", async () => {
-  expect(gateway.refund).toHaveBeenCalledTimes(1)
+  expect(gateway.refund).toHaveBeenCalledTimes(2)
 })`,
        ],
      },
    ],
    reviewGeneric: {
      patches: [
        {
          id: "p1",
          title: "Add idempotency guard for gateway retries",
          summary: "Prevent double refunds by checking existing refund before side effects.",
          touchesBusinessLogic: true,
          unifiedDiff: `diff --git a/src/refunds/refund.service.ts b/src/refunds/refund.service.ts
index 91a2c11..bb71b5a 100644
--- a/src/refunds/refund.service.ts
+++ b/src/refunds/refund.service.ts
@@ -12,6 +12,23 @@ export async function refundPayment(req: RefundRequest) {
+  // Idempotency guard: avoid double refunds if gateway retries requests
+  const existing = await db.refunds.findFirst({ where: { paymentId: req.paymentId } })
+  if (existing) {
+    return { ok: true, refundId: existing.id }
+  }
+
   const tx = await db.refunds.create({ data: { paymentId: req.paymentId, amount: req.amount } })
   await gateway.refund(req.paymentId, req.amount)
   return { ok: true, refundId: tx.id }
 }`,
        },
        {
          id: "p2",
          title: "Fix failing test expectation",
          summary: "Align test with intended behavior: retries should not cause multiple refunds.",
          touchesBusinessLogic: false,
          unifiedDiff: `diff --git a/tests/refunds.spec.ts b/tests/refunds.spec.ts
index 1f2c9ac..e20c9d1 100644
--- a/tests/refunds.spec.ts
+++ b/tests/refunds.spec.ts
@@ -22,7 +22,7 @@ it("should not double-refund when gateway retries", async () => {
-  expect(gateway.refund).toHaveBeenCalledTimes(2)
+  expect(gateway.refund).toHaveBeenCalledTimes(1)
 })`,
        },
      ],
      comments: [
        {
          id: "c1",
          filePath: "src/refunds/refund.service.ts",
          line: 35,
          severity: "critical",
          title: "Potential double-refund on gateway retry",
          message: "Flow calls gateway without an explicit idempotency guard; retries can cause duplicate refunds.",
          rationale: "Refund endpoints are classic retry surfaces—idempotency should be explicit before side effects.",
          riskScore: 86,
          suggestedPatchId: "p1",
        },
        {
          id: "c2",
          filePath: "tests/refunds.spec.ts",
          line: 22,
          severity: "warning",
          title: "Test asserts double-refund behavior",
          message: "Spec name says no double-refund but expectation enforces two refunds.",
          rationale: "Tests should encode intent; this currently institutionalizes the bug.",
          riskScore: 44,
          suggestedPatchId: "p2",
        },
        {
          id: "c3",
          filePath: "src/refunds/refund.service.ts",
          line: 51,
          severity: "info",
          title: "Avoid `any` in refund lookup",
          message: "Using `any` hides contract mismatches. Prefer a typed entity or explicit null handling.",
          rationale: "Type drift in payment code becomes expensive later.",
          riskScore: 18,
        },
      ],
    },
    reviewWithMemory: {
      memoryHits: [
        {
          id: "m1",
          source: "style-guide",
          title: "docs/engineering-style.md",
          snippet: "Prefer early returns for guard clauses. Avoid `any` in core money-flow services.",
        },
        {
          id: "m2",
          source: "past-pr",
          title: "PR #173 – Refund idempotency standard",
          snippet: "Use paymentId as idempotency key; check before side effects; log retry signatures.",
        },
        {
          id: "m3",
          source: "module-pattern",
          title: "src/refunds/README.md",
          snippet: "Refund service must be deterministic. Side effects only after idempotency gate.",
        },
      ],
      patches: [
        {
          id: "p1m",
          title: "Project-standard idempotency gate (early return + log)",
          summary: "Implements the repo’s idempotency pattern with an early return guard + log on hits.",
          touchesBusinessLogic: true,
          unifiedDiff: `diff --git a/src/refunds/refund.service.ts b/src/refunds/refund.service.ts
index 91a2c11..c2b331a 100644
--- a/src/refunds/refund.service.ts
+++ b/src/refunds/refund.service.ts
@@ -12,6 +12,28 @@ export async function refundPayment(req: RefundRequest) {
+  // Idempotency (project standard): guard before any side effects
+  const existing = await db.refunds.findFirst({ where: { paymentId: req.paymentId } })
+  if (existing) {
+    logger.info({ paymentId: req.paymentId, refundId: existing.id }, "refund.idempotent_hit")
+    return { ok: true, refundId: existing.id }
+  }
+
   const tx = await db.refunds.create({ data: { paymentId: req.paymentId, amount: req.amount } })
   await gateway.refund(req.paymentId, req.amount)
   return { ok: true, refundId: tx.id }
 }`,
        },
        {
          id: "p2m",
          title: "Restore test intent (no double-refund)",
          summary: "Makes the spec match the desired contract.",
          touchesBusinessLogic: false,
          unifiedDiff: `diff --git a/tests/refunds.spec.ts b/tests/refunds.spec.ts
index 1f2c9ac..e20c9d1 100644
--- a/tests/refunds.spec.ts
+++ b/tests/refunds.spec.ts
@@ -22,7 +22,7 @@ it("should not double-refund when gateway retries", async () => {
-  expect(gateway.refund).toHaveBeenCalledTimes(2)
+  expect(gateway.refund).toHaveBeenCalledTimes(1)
 })`,
        },
      ],
      comments: [
        {
          id: "c1m",
          filePath: "src/refunds/refund.service.ts",
          line: 12,
          severity: "critical",
          title: "Missing idempotency gate (repo standard)",
          message: "Refund service should enforce the project’s idempotency pattern: guard before side effects + structured log.",
          rationale: "Matches PR #173 + refunds README; prevents duplicates under retries and improves incident forensics.",
          riskScore: 90,
          suggestedPatchId: "p1m",
        },
        {
          id: "c2m",
          filePath: "tests/refunds.spec.ts",
          line: 22,
          severity: "warning",
          title: "Test contradicts its own intent",
          message: "Spec name says “should not double-refund” but expectation enforces two refunds.",
          rationale: "Align spec with contract, otherwise you institutionalize the bug.",
          riskScore: 48,
          suggestedPatchId: "p2m",
        },
        {
          id: "c3m",
          filePath: "src/refunds/refund.service.ts",
          line: 35,
          severity: "info",
          title: "Remove `any` from money-flow code",
          message: "Core payment logic should be typed. `any` makes reviews and refactors brittle.",
          rationale: "Style guide discourages `any` in core services.",
          riskScore: 22,
        },
      ],
    },
  },
];
