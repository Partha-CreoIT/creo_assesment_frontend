"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CloudOff, Loader2, Send, ShieldAlert } from "lucide-react";
import { studentApi } from "@/lib/api";
import { cn, formatDuration } from "@/lib/utils";
import { Button, Modal } from "@/components/ui";
import { isAnswered, useExamStore } from "@/store/examStore";
import { useProctor } from "@/hooks/useProctor";
import { useExamTimer } from "@/hooks/useExamTimer";
import QuestionPalette from "./QuestionPalette";
import ViolationOverlay from "./ViolationOverlay";
import EnglishQuestion from "./EnglishQuestion";
import McqQuestion from "./McqQuestion";
import CodingQuestion from "./CodingQuestion";

export default function ExamRoom() {
  const router = useRouter();
  const paper = useExamStore((s) => s.paper);
  const answers = useExamStore((s) => s.answers);
  const saveStates = useExamStore((s) => s.saveStates);
  const currentIdx = useExamStore((s) => s.currentIdx);
  const setCurrent = useExamStore((s) => s.setCurrent);
  const violationCount = useExamStore((s) => s.violationCount);
  const maxViolations = useExamStore((s) => s.maxViolations);
  const flushAll = useExamStore((s) => s.flushAll);

  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const finishExam = useCallback(
    async (reason: string, alreadyFinalized: boolean) => {
      try {
        if (alreadyFinalized) {
          // The server already locked the session (strike limit or sweeper) —
          // pending saves would only be rejected with 409 now. The proctor
          // flushed them before reporting the final strike.
          useExamStore.getState().cancelPendingSaves();
        } else {
          await flushAll();
          await studentApi.submit();
        }
      } catch {
        /* the server sweeper has us covered */
      }
      router.replace(`/exam/submitted?reason=${reason}`);
    },
    [flushAll, router]
  );

  // Proctoring: strikes are counted server-side; 3rd → auto submit.
  useProctor(true, (reason) => finishExam(reason, true));

  // Server-authoritative countdown; at zero, save & submit.
  const remaining = useExamTimer(paper?.endsAt, paper?.serverNow, () =>
    finishExam("time", false)
  );

  const questions = useMemo(() => paper?.questions ?? [], [paper]);
  const current = questions[currentIdx];

  const answeredCount = useMemo(
    () => questions.filter((q) => isAnswered(q, answers[q.id])).length,
    [questions, answers]
  );

  const saveSummary = useMemo(() => {
    const states = Object.values(saveStates);
    if (states.includes("error")) return "error";
    if (states.includes("saving") || states.includes("pending")) return "saving";
    return "saved";
  }, [saveStates]);

  if (!paper || !current) return null;

  const timerLevel =
    remaining !== null && remaining <= 60
      ? "danger"
      : remaining !== null && remaining <= 300
        ? "warn"
        : "normal";

  const manualSubmit = async () => {
    setSubmitting(true);
    await finishExam("manual", false);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-paper">
      {/* ── Header ── */}
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-ink bg-paper px-4">
        <span className="stamp text-green">Set {paper.setLabel}</span>
        <h1 className="font-display truncate text-lg font-semibold">
          {paper.exam.title}
        </h1>

        <div className="ml-auto flex items-center gap-4">
          {/* autosave state */}
          <span className="hidden items-center gap-1.5 text-xs text-ink-soft sm:flex">
            {saveSummary === "saving" ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
              </>
            ) : saveSummary === "error" ? (
              <span className="flex items-center gap-1.5 text-amber">
                <CloudOff className="h-3.5 w-3.5" /> Retrying save…
              </span>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-green" /> Saved
              </>
            )}
          </span>

          {/* strikes */}
          <span
            className={cn(
              "flex items-center gap-1.5 font-mono text-xs",
              violationCount > 0 ? "text-crimson" : "text-ink-soft"
            )}
            title="Proctoring violations"
          >
            <ShieldAlert className="h-4 w-4" />
            {violationCount}/{maxViolations}
          </span>

          {/* timer */}
          <span
            className={cn(
              "rounded border px-3 py-1 font-mono text-base font-semibold tabular-nums",
              timerLevel === "danger" &&
                "timer-danger border-crimson bg-crimson-soft text-crimson",
              timerLevel === "warn" && "border-amber bg-amber-soft text-amber",
              timerLevel === "normal" && "border-line bg-paper-2 text-ink"
            )}
          >
            {remaining !== null ? formatDuration(remaining) : "--:--"}
          </span>

          <Button variant="primary" onClick={() => setSubmitOpen(true)}>
            <Send className="h-4 w-4" /> Complete Test
          </Button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex min-h-0 flex-1">
        <QuestionPalette />

        <main className="min-w-0 flex-1 overflow-y-auto">
          {current.type === "english" && <EnglishQuestion question={current} />}
          {current.type === "aptitude" && <McqQuestion question={current} />}
          {current.type === "coding" && <CodingQuestion question={current} />}

          {/* ── Nav (directly below the options) ── */}
          <div className="flex items-center justify-between gap-4 border-t border-line px-4 py-3">
            <Button
              variant="outline"
              disabled={currentIdx === 0}
              onClick={() => setCurrent(currentIdx - 1)}
            >
              ← Previous
            </Button>
            <span className="font-mono text-xs text-ink-soft">
              Question {currentIdx + 1} of {questions.length} · {answeredCount}{" "}
              answered
            </span>
            <Button
              variant="outline"
              disabled={currentIdx === questions.length - 1}
              onClick={() => setCurrent(currentIdx + 1)}
            >
              Next →
            </Button>
          </div>
        </main>
      </div>

      <ViolationOverlay />

      {/* ── Submit confirmation ── */}
      <Modal
        open={submitOpen}
        onClose={() => !submitting && setSubmitOpen(false)}
        title="Submit your exam?"
      >
        <p className="text-sm text-ink-2">
          You have answered{" "}
          <strong>
            {answeredCount} of {questions.length}
          </strong>{" "}
          questions.
          {answeredCount < questions.length && (
            <>
              {" "}
              <span className="text-crimson">
                {questions.length - answeredCount} unanswered
              </span>{" "}
              question(s) will score zero.
            </>
          )}
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          Once submitted you cannot return to the paper.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="ghost"
            disabled={submitting}
            onClick={() => setSubmitOpen(false)}
          >
            Keep writing
          </Button>
          <Button variant="danger" loading={submitting} onClick={manualSubmit}>
            Submit final answers
          </Button>
        </div>
      </Modal>
    </div>
  );
}
