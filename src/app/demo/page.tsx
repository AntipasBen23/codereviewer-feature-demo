"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { PIPELINE, SCENARIOS, type Patch, type StepStatus } from "./data";
import { formatNumber } from "./utils";
import PipelinePanel from "./components/PipelinePanel";
import FileList from "./components/FileList";
import DiffAndPatch from "./components/DiffAndPatch";
import CommentsPanel from "./components/CommentsPanel";

export default function DemoPage() {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0]?.id ?? "s1");
  const scenario = useMemo(() => SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0], [scenarioId]);

  const [useMemory, setUseMemory] = useState(true);
  const [isRunning, setIsRunning] = useState(false);

  const [stepStatus, setStepStatus] = useState<Record<string, StepStatus>>(() =>
    Object.fromEntries(PIPELINE.map((s) => [s.id, "idle"]))
  );

  const [selectedFile, setSelectedFile] = useState<string>(() => scenario.diff[0]?.filePath ?? "");
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);

  const [appliedPatchIds, setAppliedPatchIds] = useState<Record<string, boolean>>({});
  const [checkState, setCheckState] = useState<"failed" | "pending" | "passed">(
    scenario.ci.status === "failing" ? "failed" : "passed"
  );
  const [botCommit, setBotCommit] = useState<string | null>(null);

  const runTokenRef = useRef(0);

  const review = useMemo(() => {
    return useMemory ? scenario.reviewWithMemory : ({ memoryHits: [], ...scenario.reviewGeneric } as any);
  }, [scenario, useMemory]);

  const memoryHits = useMemo(() => (useMemory ? scenario.reviewWithMemory.memoryHits : []), [scenario, useMemory]);

  const comments = useMemo(() => (useMemory ? scenario.reviewWithMemory.comments : scenario.reviewGeneric.comments), [
    scenario,
    useMemory,
  ]);

  const patches = useMemo(() => (useMemory ? scenario.reviewWithMemory.patches : scenario.reviewGeneric.patches), [
    scenario,
    useMemory,
  ]);

  const patchesById = useMemo<Record<string, Patch>>(
    () => Object.fromEntries(patches.map((p) => [p.id, p])),
    [patches]
  );

  const commentsForSelectedFile = useMemo(
    () => comments.filter((c) => c.filePath === selectedFile).sort((a, b) => b.riskScore - a.riskScore),
    [comments, selectedFile]
  );

  const selectedComment = useMemo(() => {
    const inFile = commentsForSelectedFile;
    return (selectedCommentId ? inFile.find((c) => c.id === selectedCommentId) : null) ?? inFile[0] ?? null;
  }, [commentsForSelectedFile, selectedCommentId]);

  useEffect(() => {
    // Reset on scenario change
    setSelectedFile(scenario.diff[0]?.filePath ?? "");
    setSelectedCommentId(null);
    setAppliedPatchIds({});
    setBotCommit(null);
    setCheckState(scenario.ci.status === "failing" ? "failed" : "passed");
    setIsRunning(false);
    setStepStatus(Object.fromEntries(PIPELINE.map((s) => [s.id, "idle"])));
  }, [scenarioId]); // eslint-disable-line react-hooks/exhaustive-deps

  function resetRun() {
    runTokenRef.current += 1;
    setIsRunning(false);
    setStepStatus(Object.fromEntries(PIPELINE.map((s) => [s.id, "idle"])));
  }

  async function runPipeline() {
    const token = ++runTokenRef.current;
    setIsRunning(true);
    setStepStatus(Object.fromEntries(PIPELINE.map((s) => [s.id, "idle"])));

    const runStep = async (id: string, ms: number) => {
      setStepStatus((prev) => ({ ...prev, [id]: "running" }));
      await new Promise((r) => setTimeout(r, ms));
      if (token !== runTokenRef.current) return;
      setStepStatus((prev) => ({ ...prev, [id]: "done" }));
    };

    await runStep("ingest", 450);
    await runStep("index", 650);
    await runStep("retrieve", useMemory ? 600 : 300);
    await runStep("analyze", 800);
    await runStep("generate", 900);
    await runStep("post", 550);

    if (token !== runTokenRef.current) return;

    // After posting, checks reflect current state (until patch applied)
    setCheckState(scenario.ci.status === "failing" ? "failed" : "passed");
    setIsRunning(false);
  }

  function applyPatch(patchId: string) {
    if (!patchesById[patchId]) return;

    setAppliedPatchIds((prev) => ({ ...prev, [patchId]: true }));
    setBotCommit("codereviewr-bot: apply suggested patch");

    // Simulate check run improving after patch
    if (checkState === "failed") setCheckState("pending");
    window.setTimeout(() => setCheckState("passed"), 900);
  }

  return (
    <div className="min-h-screen bg-[#0b0b12] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Controls + tiny PR summary (still part of feature UI) */}
        <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm text-white/70">Adaptive Code Review Coach</div>
              <div className="text-base font-semibold">
                {scenario.repo} • PR #{scenario.prNumber}
              </div>
              <div className="mt-1 text-xs text-white/60">
                {scenario.branch} • {scenario.languages.join(", ")} • {scenario.changedFiles} files • +
                {formatNumber(scenario.additions)} / -{formatNumber(scenario.deletions)}
              </div>
              {botCommit && <div className="mt-2 text-xs text-violet-200/80">Bot commit: {botCommit}</div>}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={scenarioId}
                onChange={(e) => setScenarioId(e.target.value)}
                className="rounded-xl bg-black/30 ring-1 ring-white/10 px-3 py-2 text-sm outline-none focus:ring-violet-500/40"
              >
                {SCENARIOS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.repo} • PR #{s.prNumber}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setUseMemory((v) => !v)}
                className={
                  useMemory
                    ? "rounded-xl px-3 py-2 text-sm bg-violet-500/15 text-violet-100 ring-1 ring-violet-500/25"
                    : "rounded-xl px-3 py-2 text-sm bg-white/5 text-white/80 ring-1 ring-white/10 hover:bg-white/10"
                }
              >
                {useMemory ? "Project Memory: ON" : "Project Memory: OFF"}
              </button>

              <button
                onClick={runPipeline}
                disabled={isRunning}
                className={
                  isRunning
                    ? "rounded-xl px-4 py-2 text-sm font-medium bg-white/5 text-white/40 ring-1 ring-white/10 cursor-not-allowed"
                    : "rounded-xl px-4 py-2 text-sm font-medium bg-violet-500 text-white ring-1 ring-violet-500/40 hover:bg-violet-400"
                }
              >
                {isRunning ? "Running…" : "Run Review"}
              </button>

              <button
                onClick={resetRun}
                className="rounded-xl px-3 py-2 text-sm bg-white/5 text-white/80 ring-1 ring-white/10 hover:bg-white/10"
              >
                Reset
              </button>

              <span
                className={
                  checkState === "passed"
                    ? "rounded-full px-3 py-1 text-xs bg-emerald-500/10 text-emerald-200 ring-1 ring-emerald-500/20"
                    : checkState === "pending"
                    ? "rounded-full px-3 py-1 text-xs bg-amber-500/10 text-amber-200 ring-1 ring-amber-500/20"
                    : "rounded-full px-3 py-1 text-xs bg-red-500/10 text-red-200 ring-1 ring-red-500/20"
                }
              >
                {checkState === "passed" ? "Checks Passed" : checkState === "pending" ? "Checks Pending" : "Checks Failed"}
              </span>
            </div>
          </div>
        </div>

        {/* Pipeline */}
        <div className="mt-4">
          <PipelinePanel
            title="Review pipeline"
            subtitle={useMemory ? "Context-aware review (with Project Memory)" : "Generic review (no memory)"}
            pipeline={PIPELINE}
            stepStatus={stepStatus}
            useMemory={useMemory}
            memoryHits={memoryHits}
          />
        </div>

        {/* PR view */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-3">
            <FileList
              scenario={scenario}
              comments={comments}
              selectedFile={selectedFile}
              onSelectFile={(fp) => {
                setSelectedFile(fp);
                setSelectedCommentId(null);
              }}
            />
          </div>

          <div className="lg:col-span-6">
            <DiffAndPatch
              scenario={scenario}
              selectedFile={selectedFile}
              selectedComment={selectedComment}
              patchesById={patchesById}
              appliedPatchIds={appliedPatchIds}
              onApplyPatch={applyPatch}
            />
          </div>

          <div className="lg:col-span-3">
            <CommentsPanel
              selectedFile={selectedFile}
              commentsForSelectedFile={commentsForSelectedFile}
              selectedCommentId={selectedCommentId}
              onSelectComment={setSelectedCommentId}
              patchesById={patchesById}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
