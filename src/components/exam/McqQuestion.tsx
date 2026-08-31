"use client";

import ReactMarkdown from "react-markdown";
import type { PaperQuestion } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useExamStore } from "@/store/examStore";
import { QuestionHeader, HintBox } from "./QuestionHeader";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export default function McqQuestion({
  question,
}: {
  question: PaperQuestion;
}) {
  const draft = useExamStore((s) => s.answers[question.id]);
  const updateAnswer = useExamStore((s) => s.updateAnswer);
  const selected = draft?.selectedIndex ?? null;

  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      <QuestionHeader question={question} />

      <div className="qbody mt-5 text-[15px]">
        <ReactMarkdown>{question.body}</ReactMarkdown>
      </div>

      <div className="mt-6 space-y-4">
        <HintBox hint={question.hint} />

        <div className="space-y-2.5">
          {(question.options ?? []).map((opt, i) => {
            const isSel = selected === i;
            return (
              <button
                key={i}
                onClick={() =>
                  updateAnswer(question.id, {
                    selectedIndex: isSel ? null : i,
                  })
                }
                className={cn(
                  "flex w-full items-center gap-4 rounded border px-4 py-3.5 text-left text-[15px] transition-all",
                  isSel
                    ? "border-green bg-green-soft shadow-[2px_2px_0_var(--color-line)]"
                    : "border-line bg-white/60 hover:border-ink-soft"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-semibold",
                    isSel
                      ? "border-green bg-green text-paper"
                      : "border-line text-ink-soft"
                  )}
                >
                  {LETTERS[i] ?? i + 1}
                </span>
                <span className={cn(isSel && "font-medium")}>{opt}</span>
              </button>
            );
          })}
        </div>

        {selected !== null && (
          <button
            onClick={() => updateAnswer(question.id, { selectedIndex: null })}
            className="text-xs text-ink-soft underline hover:text-ink"
          >
            Clear selection
          </button>
        )}
      </div>
    </div>
  );
}
