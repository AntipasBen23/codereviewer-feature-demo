"use client";

import React from "react";
import type { PipelineStep, StepStatus, MemoryHit } from "../data";
import { cn, dotForStatus, prettySource } from "../utils";

type Props = {
  title: string;
  subtitle?: string;
  pipeline: PipelineStep[];
  stepStatus: Record<string, StepStatus>;
  useMemory: boolean;
  memoryHits: MemoryHit[];
};

export default function PipelinePanel({
  title,
  subtitle,
  pipeline,
  stepStatus,
  useMemory,
  memoryHits,
}: Props) {
  return (
    <section className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm text-white/70">{title}</div>
          <div className="text-base font-semibold">{subtitle}</div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-white/60">
            {useMemory ? `${memoryHits.length} memory hits` : "memory off"}
          </span>
          <span
            className={cn(
              "text-[11px] rounded-full px-2 py-0.5 ring-1",
              useMemory
                ? "bg-violet-500/10 text-violet-200 ring-violet-500/20"
                : "bg-white/5 text-white/60 ring-white/10"
            )}
          >
            {useMemory ? "Project Memory: ON" : "Project Memory: OFF"}
          </span>
        </div>
      </div>

      {/* Pipeline steps */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {pipeline.map((step) => {
          const st = stepStatus[step.id] ?? "idle";
          return (
            <div key={step.id} className="rounded-xl bg-black/20 ring-1 ring-white/10 p-3">
              <div className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", dotForStatus(st))} />
                <div className="font-medium">{step.label}</div>
                <span className="ml-auto text-xs text-white/60">
                  {st === "idle" ? "Idle" : st === "running" ? "Running" : st === "done" ? "Done" : "Error"}
                </span>
              </div>
              <div className="mt-1 text-xs text-white/60">{step.description}</div>
            </div>
          );
        })}
      </div>

      {/* Memory hits */}
      <div className="mt-4 rounded-xl bg-black/20 ring-1 ring-white/10 p-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Memory hits</div>
          <div className="text-xs text-white/60">{useMemory ? `${memoryHits.length} sources matched` : "Disabled"}</div>
        </div>

        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
          {!useMemory ? (
            <div className="text-xs text-white/60">
              Turn on “Project Memory” to show repo-specific context retrieval.
            </div>
          ) : memoryHits.length === 0 ? (
            <div className="text-xs text-white/60">No memory hits in this scenario.</div>
          ) : (
            memoryHits.map((m) => (
              <div key={m.id} className="rounded-lg bg-white/5 ring-1 ring-white/10 p-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-medium">{m.title}</div>
                  <span className="text-[11px] rounded-full px-2 py-0.5 bg-violet-500/10 text-violet-200 ring-1 ring-violet-500/20">
                    {prettySource(m.source)}
                  </span>
                </div>
                <div className="mt-1 text-xs text-white/60">{m.snippet}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
