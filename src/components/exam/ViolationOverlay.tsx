"use client";

import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui";
import { useExamStore } from "@/store/examStore";
import { VIOLATION_LABEL } from "@/lib/utils";

export default function ViolationOverlay() {
  const overlayKind = useExamStore((s) => s.overlayKind);
  const violationCount = useExamStore((s) => s.violationCount);
  const maxViolations = useExamStore((s) => s.maxViolations);
  const closeOverlay = useExamStore((s) => s.closeOverlay);
  const autoSubmitted = useExamStore((s) => s.autoSubmitted);

  if (!overlayKind || autoSubmitted) return null;

  const remaining = Math.max(0, maxViolations - violationCount);

  const resume = async () => {
    closeOverlay();
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        /* the fullscreenchange strike already fired; button stays available */
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-crimson-2/95 p-6 text-paper">
      <div className="shake w-full max-w-lg text-center">
        <ShieldAlert className="mx-auto h-14 w-14" />
        <p className="label-caps mt-6 !text-paper/70">Proctoring violation</p>
        <h2 className="font-display mt-2 text-4xl font-semibold">
          {VIOLATION_LABEL[overlayKind] ?? "You left the exam"}
        </h2>

        <div className="mx-auto mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: maxViolations }).map((_, i) => (
            <span
              key={i}
              className={`h-3 w-10 rounded-sm ${
                i < violationCount ? "bg-paper" : "bg-paper/25"
              }`}
            />
          ))}
        </div>
        <p className="mt-3 font-mono text-sm text-paper/90">
          Strike {Math.min(violationCount, maxViolations)} of {maxViolations}
        </p>

        <p className="mx-auto mt-4 max-w-sm text-sm text-paper/80">
          {remaining === 1
            ? "This is your final warning. One more violation and your exam will be submitted automatically."
            : remaining === 0
              ? "Submitting your exam…"
              : `${remaining} more violation${remaining > 1 ? "s" : ""} and your exam will be submitted automatically.`}
        </p>

        <Button
          onClick={resume}
          className="mt-8 !border-paper !bg-paper !text-crimson-2 hover:!bg-paper/90 px-8 py-3 text-base"
        >
          Return to the exam
        </Button>
      </div>
    </div>
  );
}
