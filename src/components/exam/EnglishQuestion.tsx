"use client";

import ReactMarkdown from "react-markdown";
import type { PaperQuestion } from "@/lib/types";
import { Textarea } from "@/components/ui";
import { useExamStore } from "@/store/examStore";
import { QuestionHeader, HintBox } from "./QuestionHeader";

export default function EnglishQuestion({
  question,
}: {
  question: PaperQuestion;
}) {
  const draft = useExamStore((s) => s.answers[question.id]);
  const updateAnswer = useExamStore((s) => s.updateAnswer);

  const words = (draft?.answerText ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      <QuestionHeader question={question} />

      <div className="qbody mt-5 text-[15px]">
        <ReactMarkdown>{question.body}</ReactMarkdown>
      </div>

      <div className="mt-6 space-y-4">
        <HintBox hint={question.hint} />

        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <label className="label-caps" htmlFor={`answer-${question.id}`}>
              Your answer
            </label>
            <span className="font-mono text-[11px] text-ink-soft">
              {words} word{words === 1 ? "" : "s"}
            </span>
          </div>
          <Textarea
            id={`answer-${question.id}`}
            rows={12}
            placeholder="Write your answer here…"
            value={draft?.answerText ?? ""}
            onChange={(e) =>
              updateAnswer(question.id, { answerText: e.target.value })
            }
            className="text-[15px] leading-relaxed"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
