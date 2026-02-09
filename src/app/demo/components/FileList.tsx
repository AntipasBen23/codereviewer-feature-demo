"use client";

import React from "react";
import type { PRScenario, ReviewComment } from "../data";
import { cn } from "../utils";

type Props = {
  scenario: PRScenario;
  comments: ReviewComment[];
  selectedFile: string;
  onSelectFile: (filePath: string) => void;
};

export default function FileList({ scenario, comments, selectedFile, onSelectFile }: Props) {
  return (
    <section className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
      <div className="text-sm text-white/70">Changed files</div>

      <div className="mt-2 space-y-1">
        {scenario.diff.map((d) => {
          const active = d.filePath === selectedFile;
          const issueCount = comments.filter((c) => c.filePath === d.filePath).length;

          return (
            <button
              key={d.filePath}
              onClick={() => onSelectFile(d.filePath)}
              className={cn(
                "w-full text-left rounded-xl px-3 py-2 ring-1 transition",
                active
                  ? "bg-violet-500/15 ring-violet-500/25"
                  : "bg-black/20 ring-white/10 hover:bg-white/10"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium truncate">{d.filePath}</div>
                <span className="text-xs text-white/60">{issueCount} issues</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* CI logs */}
      <div className="mt-4 rounded-xl bg-black/20 ring-1 ring-white/10 p-3">
        <div className="text-xs text-white/60">CI logs</div>
        <pre className="mt-2 text-[11px] leading-relaxed text-white/80 whitespace-pre-wrap">
          {scenario.ci.logs.join("\n")}
        </pre>
      </div>
    </section>
  );
}
