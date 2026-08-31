"use client";

import { useMemo } from "react";
import { cn, QUESTION_TYPE_LABEL } from "@/lib/utils";
import { isAnswered, useExamStore } from "@/store/examStore";
import type { PaperQuestion } from "@/lib/types";

const SECTION_ORDER: Array<PaperQuestion["type"]> = [
  "english",
  "aptitude",
  "coding",
];

export default function QuestionPalette() {
  const paper = useExamStore((s) => s.paper);
  const answers = useExamStore((s) => s.answers);
  const currentIdx = useExamStore((s) => s.currentIdx);
  const setCurrent = useExamStore((s) => s.setCurrent);

  const sections = useMemo(() => {
    const qs = paper?.questions ?? [];
    return SECTION_ORDER.map((type) => ({
      type,
      items: qs
        .map((q, idx) => ({ q, idx }))
        .filter(({ q }) => q.type === type),
    })).filter((s) => s.items.length > 0);
  }, [paper]);

  if (!paper) return null;

  return (
    <aside className="w-56 shrink-0 overflow-y-auto border-r border-line bg-paper-2/60 px-4 py-5">
      {sections.map(({ type, items }) => (
        <div key={type} className="mb-6">
          <p className="label-caps mb-2">
            {QUESTION_TYPE_LABEL[type]}{" "}
            <span className="text-ink-soft/60">· {items.length}</span>
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {items.map(({ q, idx }) => {
              const answered = isAnswered(q, answers[q.id]);
              const active = idx === currentIdx;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrent(idx)}
                  title={q.title}
                  className={cn(
                    "flex h-9 items-center justify-center rounded border font-mono text-xs font-medium transition-colors",
                    active
                      ? "border-ink bg-ink text-paper"
                      : answered
                        ? "border-green/50 bg-green-soft text-green hover:border-green"
                        : "border-line bg-white/60 text-ink-soft hover:border-ink-soft hover:text-ink"
                  )}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="mt-8 space-y-1.5 border-t border-line pt-4 text-[11px] text-ink-soft">
        <p className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded border border-green/50 bg-green-soft" />
          Answered
        </p>
        <p className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded border border-line bg-white/60" />
          Not answered
        </p>
        <p className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded border border-ink bg-ink" />
          Current
        </p>
      </div>
    </aside>
  );
}
