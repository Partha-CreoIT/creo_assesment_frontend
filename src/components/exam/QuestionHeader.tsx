"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ChevronDown, Lightbulb } from "lucide-react";
import type { PaperQuestion } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Chip, typeTone } from "@/components/ui";
import { QUESTION_TYPE_LABEL } from "@/lib/utils";

export function QuestionHeader({ question }: { question: PaperQuestion }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone={typeTone(question.type)}>
          {QUESTION_TYPE_LABEL[question.type]}
        </Chip>
        {question.difficulty && (
          <Chip tone="ink" className="capitalize">
            {question.difficulty}
          </Chip>
        )}
        <Chip tone="green">{question.marks} marks</Chip>
      </div>
      <h2 className="font-display mt-3 text-2xl font-semibold leading-snug">
        {question.title}
      </h2>
    </div>
  );
}

export function HintBox({ hint }: { hint: string }) {
  const [open, setOpen] = useState(false);
  if (!hint) return null;
  return (
    <div className="rounded border border-amber/40 bg-amber-soft/60">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-amber"
      >
        <Lightbulb className="h-4 w-4" />
        {open ? "Hide hint" : "Show hint"}
        <ChevronDown
          className={cn("ml-auto h-4 w-4 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="qbody border-t border-amber/30 px-4 py-3 text-sm text-ink-2">
          <ReactMarkdown>{hint}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
