"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { tokens } from "@/lib/api";
import { useExamStore } from "@/store/examStore";

const REASON_TEXT: Record<string, { title: string; body: string }> = {
  manual: {
    title: "Answers submitted.",
    body: "Your responses have been recorded and are being evaluated. Your coordinator will announce the results.",
  },
  time: {
    title: "Time's up — exam submitted.",
    body: "Your exam time ended, so your saved answers were submitted automatically. Everything you saved has been recorded.",
  },
  violations: {
    title: "Exam submitted due to violations.",
    body: "The violation limit was reached, so your exam was submitted automatically with the answers saved so far. This attempt has been flagged for review.",
  },
  done: {
    title: "This attempt is already submitted.",
    body: "Your responses have been recorded. Each candidate gets a single attempt.",
  },
};

export default function SubmittedPage() {
  const [reason, setReason] = useState("manual");
  const reset = useExamStore((s) => s.reset);

  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get("reason");
    if (r && REASON_TEXT[r]) setReason(r);
    reset();
    tokens.student.clear();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, [reset]);

  const text = REASON_TEXT[reason];
  const flagged = reason === "violations";

  return (
    <div className="dotgrid flex min-h-screen items-center justify-center p-6">
      <div className="rise w-full max-w-lg text-center">
        <div
          className={`stamp mx-auto mb-6 !border-2 px-6 py-2 text-lg ${
            flagged ? "text-crimson" : "text-green"
          }`}
          style={{ transform: "rotate(-3deg)" }}
        >
          {flagged ? "Flagged · Submitted" : "Submitted"}
        </div>

        <CheckCircle2
          className={`mx-auto h-12 w-12 ${
            flagged ? "text-crimson" : "text-green"
          }`}
        />
        <h1 className="font-display mt-4 text-4xl font-semibold">
          {text.title}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-ink-soft">{text.body}</p>

        <Link
          href="/"
          className="mt-8 inline-block text-sm text-ink-soft underline hover:text-ink"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
