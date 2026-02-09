"use client";

import React from "react";
import type { Patch, ReviewComment, PRScenario } from "../data";
import { cn } from "../utils";

type Props = {
  scenario: PRScenario;
  selectedFile: string;
  selectedComment: ReviewComment | null;
  patchesById: Record<string, Patch>;
  appliedPatchIds: Record<string, boolean>;
  onApplyPatch: (patchId: string) => void;
};

export default function DiffAndPatch({
  scenario,
  selectedFile,
  selectedComment,
  patchesById,
  appliedPatchIds,
  onApplyPatch,
}: Props) {
  const selectedFileDiff = scenario.diff.find((d) => d.filePath === selectedFile);

  const patchId = selectedComment?.suggestedPatchId;
  const patch = patchId ? patchesById[patchId] : null;

  return (
    <section className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm text-white/70">Diff</div>
          <div className="text-base font-semibold">{selectedFile}</div>
        </div>
        <span className="text-xs text-white/60">{selectedFileDiff?.hunks.length ?? 0} hunks</span>
      </div>

      <div className="mt-3 rounded-xl bg-black/30 ring-1 ring-white/10 p-3 overflow-auto">
        <pre className="text-[12px] leading-relaxed text-white/85 whitespace-pre">
          {(selectedFileDiff?.hunks ?? ["No diff found."]).join("\n\n")}
        </pre>
      </div>

      {/* Suggested patch */}
      <div className="mt-4 rounded-xl bg-black/20 ring-1 ring-white/10 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-medium">Suggested patch</div>
          <div className="text-xs text-white/60">{patch ? "Patch-ready diff" : "No patch attached"}</div>
        </div>

        {!patch ? (
          <div className="mt-2 text-xs text-white/60">
            Select a comment with an attached patch suggestion to preview and apply it.
          </div>
        ) : (
          (() => {
            const applied = !!appliedPatchIds[patch.id];
            return (
              <div className="mt-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold">{patch.title}</div>
                  <span
                    className={cn(
                      "text-[11px] rounded-full px-2 py-0.5 ring-1",
                      patch.touchesBusinessLogic
                        ? "bg-red-500/10 text-red-200 ring-red-500/20"
                        : "bg-emerald-500/10 text-emerald-200 ring-emerald-500/20"
                    )}
                  >
                    {patch.touchesBusinessLogic ? "Touches logic" : "Safe-ish"}
                  </span>
                </div>

                <div className="mt-1 text-xs text-white/60">{patch.summary}</div>

                <div className="mt-3 rounded-lg bg-black/40 ring-1 ring-white/10 p-3 overflow-auto">
                  <pre className="text-[11px] leading-relaxed text-white/85 whitespace-pre">{patch.unifiedDiff}</pre>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => onApplyPatch(patch.id)}
                    disabled={applied}
                    className={cn(
                      "rounded-xl px-4 py-2 text-sm font-medium ring-1 transition",
                      applied
                        ? "bg-white/5 text-white/40 ring-white/10 cursor-not-allowed"
                        : "bg-violet-500 text-white ring-violet-500/40 hover:bg-violet-400"
                    )}
                  >
                    {applied ? "Applied ✓" : "Apply patch (simulate bot commit)"}
                  </button>

                  <div className="text-xs text-white/60">
                    Demo simulation: applies instantly; real product pushes a commit to the PR branch.
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </div>
    </section>
  );
}
