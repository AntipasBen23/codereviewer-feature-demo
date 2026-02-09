"use client";

import React, { useEffect } from "react";
import type { Patch, ReviewComment } from "../data";
import { badgeForSeverity, cn, riskPill } from "../utils";

type Props = {
  selectedFile: string;
  commentsForSelectedFile: ReviewComment[];
  selectedCommentId: string | null;
  onSelectComment: (id: string) => void;
  patchesById: Record<string, Patch>;
};

export default function CommentsPanel({
  selectedFile,
  commentsForSelectedFile,
  selectedCommentId,
  onSelectComment,
  patchesById,
}: Props) {
  // auto select the top comment if none selected
  useEffect(() => {
    if (!selectedCommentId && commentsForSelectedFile[0]) {
      onSelectComment(commentsForSelectedFile[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile, commentsForSelectedFile.length]);

  const selectedComment =
    commentsForSelectedFile.find((c) => c.id === selectedCommentId) ?? commentsForSelectedFile[0] ?? null;

  return (
    <section className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-white/70">AI review</div>
          <div className="text-base font-semibold">Comments</div>
        </div>
        <span className="text-xs text-white/60">{commentsForSelectedFile.length} for file</span>
      </div>

      <div className="mt-3 space-y-2">
        {commentsForSelectedFile.length === 0 ? (
          <div className="text-xs text-white/60">No comments for this file.</div>
        ) : (
          commentsForSelectedFile.map((c) => {
            const active = c.id === selectedComment?.id;
            return (
              <button
                key={c.id}
                onClick={() => onSelectComment(c.id)}
                className={cn(
                  "w-full text-left rounded-xl p-3 ring-1 transition",
                  active ? "bg-white/10 ring-white/20" : "bg-black/20 ring-white/10 hover:bg-white/10"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={cn("text-[11px] rounded-full px-2 py-0.5", badgeForSeverity(c.severity))}>
                    {c.severity.toUpperCase()}
                  </span>
                  <span className={cn("text-[11px] rounded-full px-2 py-0.5", riskPill(c.riskScore))}>
                    Risk {c.riskScore}
                  </span>
                </div>
                <div className="mt-2 text-sm font-semibold">{c.title}</div>
                <div className="mt-1 text-xs text-white/60 line-clamp-3">{c.message}</div>
              </button>
            );
          })
        )}
      </div>

      {/* Detail */}
      <div className="mt-4 rounded-xl bg-black/20 ring-1 ring-white/10 p-3">
        <div className="text-sm font-medium">Detail</div>

        {!selectedComment ? (
          <div className="mt-2 text-xs text-white/60">Select a comment to see details.</div>
        ) : (
          <>
            <div className="mt-2 text-xs text-white/60">
              <span className="text-white/80">{selectedComment.filePath}</span> • line{" "}
              <span className="text-white/80">{selectedComment.line}</span>
            </div>

            <div className="mt-2 text-sm font-semibold">{selectedComment.title}</div>
            <div className="mt-1 text-xs text-white/70">{selectedComment.message}</div>

            <div className="mt-3 text-xs text-white/60">Why this matters</div>
            <div className="mt-1 text-xs text-white/75">{selectedComment.rationale}</div>

            {selectedComment.suggestedPatchId ? (
              <div className="mt-3 text-[11px] text-violet-200/80">
                Patch attached:{" "}
                <span className="text-violet-100 font-medium">
                  {patchesById[selectedComment.suggestedPatchId]?.title ?? selectedComment.suggestedPatchId}
                </span>
              </div>
            ) : (
              <div className="mt-3 text-[11px] text-white/55">No patch attached for this comment.</div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
