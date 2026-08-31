"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { AlertTriangle, Clock, Expand } from "lucide-react";
import { ApiError, studentApi, tokens } from "@/lib/api";
import type { MeResponse } from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import { Button, Card, ErrorNote, Spinner } from "@/components/ui";
import ExamRoom from "@/components/exam/ExamRoom";
import { useExamStore } from "@/store/examStore";
import { useExamTimer } from "@/hooks/useExamTimer";

type Phase = "loading" | "gate" | "exam" | "error";

export default function ExamPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [me, setMe] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [starting, setStarting] = useState(false);
  const init = useExamStore((s) => s.init);

  useEffect(() => {
    const token = tokens.student.get();
    if (!token) {
      router.replace("/");
      return;
    }
    studentApi
      .me()
      .then((res) => {
        if (res.status !== "active") {
          router.replace("/exam/submitted?reason=done");
          return;
        }
        setMe(res);
        setPhase("gate");
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) {
          tokens.student.clear();
          router.replace("/");
        } else {
          setError(e instanceof ApiError ? e.message : "Failed to load session");
          setPhase("error");
        }
      });
  }, [router]);

  // countdown shown on the gate — the clock started at registration
  const remaining = useExamTimer(me?.endsAt, me?.serverNow, () => {});

  const begin = useCallback(async () => {
    setStarting(true);
    setError(null);
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      setError(
        "Your browser blocked fullscreen. Please allow fullscreen for this site and try again."
      );
      setStarting(false);
      return;
    }
    try {
      const paper = await studentApi.paper();
      init(paper);
      setPhase("exam");
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        router.replace("/exam/submitted?reason=done");
        return;
      }
      setError(e instanceof ApiError ? e.message : "Failed to load your paper");
      if (document.fullscreenElement) await document.exitFullscreen();
    } finally {
      setStarting(false);
    }
  }, [init, router]);

  if (phase === "loading") return <Spinner className="min-h-screen" />;

  if (phase === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4">
          <ErrorNote message={error} />
          <Button variant="outline" onClick={() => location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "exam") return <ExamRoom />;

  /* ── Instructions gate ── */
  return (
    <div className="dotgrid min-h-screen">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <p className="label-caps rise">Ready to begin</p>
        <h1 className="font-display rise mt-2 text-4xl font-semibold">
          {me?.exam.title}
        </h1>

        <div className="rise mt-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="stamp text-green">Set {me?.setLabel}</span>
          <span className="text-ink-soft">
            Candidate: <strong className="text-ink">{me?.studentName}</strong>
          </span>
          <span className="ml-auto inline-flex items-center gap-2 font-mono text-sm text-ink-2">
            <Clock className="h-4 w-4 text-amber" />
            {remaining !== null
              ? `${formatDuration(remaining)} remaining`
              : "…"}
          </span>
        </div>

        <Card className="rise mt-6 p-6" >
          <h2 className="label-caps">Instructions</h2>
          <div className="qbody mt-2 text-[15px]">
            <ReactMarkdown>{me?.exam.instructions || ""}</ReactMarkdown>
          </div>

          <div className="mt-5 rounded border border-amber/40 bg-amber-soft px-4 py-3 text-sm text-amber">
            <AlertTriangle className="mr-2 inline h-4 w-4" />
            Your timer started at registration and keeps running even if you
            leave this page. Leaving fullscreen, switching tabs or switching
            windows counts as a violation — after{" "}
            <strong>{me?.exam.maxViolations}</strong> your exam submits
            automatically.
          </div>

          <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-green"
            />
            <span>
              I have read the instructions and understand the proctoring rules.
            </span>
          </label>

          <ErrorNote message={error} />

          <Button
            variant="green"
            className="mt-5 w-full py-3 text-base"
            disabled={!agreed}
            loading={starting}
            onClick={begin}
          >
            <Expand className="h-4 w-4" />
            Enter Fullscreen &amp; Begin
          </Button>
        </Card>
      </div>
    </div>
  );
}
