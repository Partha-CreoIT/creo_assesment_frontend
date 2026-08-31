"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import Editor from "@monaco-editor/react";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  FileText,
  Play,
  Terminal,
  XCircle,
} from "lucide-react";
import { ApiError, studentApi } from "@/lib/api";
import type { PaperQuestion, RunResponse } from "@/lib/types";
import { cn, LANGUAGE_LABEL } from "@/lib/utils";
import { Button, Select, Textarea } from "@/components/ui";
import { useExamStore } from "@/store/examStore";
import { QuestionHeader, HintBox } from "./QuestionHeader";

const MONACO_LANG: Record<string, string> = {
  python: "python",
  java: "java",
  c: "c",
};

export default function CodingQuestion({
  question,
}: {
  question: PaperQuestion;
}) {
  const draft = useExamStore((s) => s.answers[question.id]);
  const updateAnswer = useExamStore((s) => s.updateAnswer);

  const [leftTab, setLeftTab] = useState<"problem" | "syntax">("problem");
  const [consoleTab, setConsoleTab] = useState<"tests" | "custom">("tests");
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResponse | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [stdin, setStdin] = useState("");

  // Monaco loads from CDN — fall back to a plain editor if it can't.
  const [editorReady, setEditorReady] = useState(false);
  const [editorFailed, setEditorFailed] = useState(false);
  const readyRef = useRef(false);
  useEffect(() => {
    const t = setTimeout(() => {
      if (!readyRef.current) setEditorFailed(true);
    }, 8000);
    return () => clearTimeout(t);
  }, []);

  const language = draft?.language || "python";
  const code = draft?.code ?? "";

  const switchLanguage = (lang: string) => {
    const starters = Object.values(question.starterCode ?? {});
    const shouldSwap = code.trim() === "" || starters.includes(code);
    updateAnswer(question.id, {
      language: lang,
      ...(shouldSwap ? { code: question.starterCode?.[lang] ?? "" } : {}),
    });
  };

  const run = async (mode: "samples" | "custom") => {
    setRunning(true);
    setRunError(null);
    setConsoleOpen(true);
    setConsoleTab(mode === "samples" ? "tests" : "custom");
    try {
      const res = await studentApi.run({
        questionId: question.id,
        language,
        code,
        mode,
        stdin: mode === "custom" ? stdin : undefined,
      });
      setRunResult(res);
    } catch (e) {
      setRunError(
        e instanceof ApiError ? e.message : "Run failed — try again."
      );
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex h-full min-h-0">
      {/* ── Problem panel ── */}
      <div className="flex w-[42%] min-w-[320px] flex-col border-r border-line">
        <div className="flex shrink-0 border-b border-line">
          {(
            [
              ["problem", "Problem", FileText],
              ["syntax", "Syntax help", BookOpen],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setLeftTab(key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors",
                leftTab === key
                  ? "border-b-2 border-green text-ink"
                  : "text-ink-soft hover:text-ink"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {leftTab === "problem" ? (
            <>
              <QuestionHeader question={question} />
              <div className="qbody mt-4 text-sm">
                <ReactMarkdown>{question.body}</ReactMarkdown>
              </div>

              {question.sampleTests && question.sampleTests.length > 0 && (
                <div className="mt-5">
                  <p className="label-caps mb-2">Sample tests</p>
                  <div className="space-y-2">
                    {question.sampleTests.map((t, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-2 gap-px overflow-hidden rounded border border-line bg-line font-mono text-xs"
                      >
                        <div className="bg-paper-2 p-2.5">
                          <p className="label-caps mb-1 !text-[9px]">Input</p>
                          <pre className="whitespace-pre-wrap">{t.input}</pre>
                        </div>
                        <div className="bg-paper-2 p-2.5">
                          <p className="label-caps mb-1 !text-[9px]">
                            Expected output
                          </p>
                          <pre className="whitespace-pre-wrap">{t.expected}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                  {(question.hiddenTestCount ?? 0) > 0 && (
                    <p className="mt-2 text-xs text-ink-soft">
                      + {question.hiddenTestCount} hidden test
                      {question.hiddenTestCount === 1 ? "" : "s"} run at final
                      grading.
                    </p>
                  )}
                </div>
              )}

              <div className="mt-5">
                <HintBox hint={question.hint} />
              </div>
            </>
          ) : (
            <div className="qbody text-sm">
              {question.syntaxNote ? (
                <ReactMarkdown>{question.syntaxNote}</ReactMarkdown>
              ) : (
                <p className="text-ink-soft">
                  No syntax notes for this question.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Editor + console ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-12 shrink-0 items-center gap-3 border-b border-line px-3">
          <Select
            value={language}
            onChange={(e) => switchLanguage(e.target.value)}
            className="!w-36"
            aria-label="Language"
          >
            {Object.entries(LANGUAGE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          {language === "java" && (
            <span className="hidden font-mono text-[11px] text-ink-soft lg:inline">
              class must be named Main
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => run("custom")}
              disabled={running}
              className="!px-3 !py-1.5 text-xs"
            >
              <Terminal className="h-3.5 w-3.5" /> Run custom input
            </Button>
            <Button
              variant="green"
              onClick={() => run("samples")}
              loading={running}
              className="!px-4 !py-1.5 text-xs"
            >
              <Play className="h-3.5 w-3.5" /> Run sample tests
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1">
          {editorFailed ? (
            <textarea
              value={code}
              onChange={(e) =>
                updateAnswer(question.id, { code: e.target.value })
              }
              spellCheck={false}
              className="h-full w-full resize-none bg-[#fffefb] p-4 font-mono text-sm leading-relaxed focus:outline-none"
            />
          ) : (
            <Editor
              height="100%"
              language={MONACO_LANG[language]}
              value={code}
              onChange={(v) => updateAnswer(question.id, { code: v ?? "" })}
              onMount={() => {
                readyRef.current = true;
                setEditorReady(true);
              }}
              theme="vs"
              loading={
                <div className="p-4 font-mono text-xs text-ink-soft">
                  Loading editor…
                </div>
              }
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                contextmenu: false,
                padding: { top: 12 },
              }}
            />
          )}
        </div>

        {/* ── Console ── */}
        <div
          className={cn(
            "shrink-0 border-t border-line bg-paper-2/70",
            consoleOpen ? "h-60" : "h-9"
          )}
        >
          <div className="flex h-9 items-center gap-1 border-b border-line-soft px-2">
            {(
              [
                ["tests", "Test results"],
                ["custom", "Custom input"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => {
                  setConsoleTab(key);
                  setConsoleOpen(true);
                }}
                className={cn(
                  "rounded px-3 py-1 font-mono text-[11px] font-medium",
                  consoleTab === key && consoleOpen
                    ? "bg-ink text-paper"
                    : "text-ink-soft hover:text-ink"
                )}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => setConsoleOpen(!consoleOpen)}
              className="ml-auto rounded p-1 text-ink-soft hover:text-ink"
              aria-label="Toggle console"
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  !consoleOpen && "rotate-180"
                )}
              />
            </button>
          </div>

          {consoleOpen && (
            <div className="h-[calc(100%-2.25rem)] overflow-y-auto p-3">
              {runError && (
                <p className="rounded border border-crimson/40 bg-crimson-soft px-3 py-2 font-mono text-xs text-crimson">
                  {runError}
                </p>
              )}

              {consoleTab === "custom" ? (
                <div className="grid h-full grid-cols-2 gap-3">
                  <div className="flex flex-col">
                    <p className="label-caps mb-1 !text-[10px]">stdin</p>
                    <Textarea
                      value={stdin}
                      onChange={(e) => setStdin(e.target.value)}
                      placeholder="Type the input your program should read…"
                      className="flex-1 resize-none font-mono text-xs"
                    />
                  </div>
                  <div className="flex min-h-0 flex-col">
                    <p className="label-caps mb-1 !text-[10px]">output</p>
                    <pre className="flex-1 overflow-y-auto whitespace-pre-wrap rounded border border-line bg-ink p-2.5 font-mono text-xs text-paper">
                      {runResult?.mode === "custom"
                        ? !runResult.compileOk
                          ? `— compile error —\n${runResult.compileOutput}`
                          : [
                              runResult.stdout,
                              runResult.stderr &&
                                `\n[stderr]\n${runResult.stderr}`,
                              runResult.timedOut && "\n[timed out]",
                            ]
                              .filter(Boolean)
                              .join("") || "(no output)"
                        : "Run with custom input to see output here."}
                    </pre>
                  </div>
                </div>
              ) : runResult?.mode === "samples" ? (
                !runResult.compileOk ? (
                  <div>
                    <p className="mb-1 font-mono text-xs font-semibold text-crimson">
                      Compilation failed
                    </p>
                    <pre className="whitespace-pre-wrap rounded border border-crimson/40 bg-crimson-soft p-2.5 font-mono text-xs text-crimson">
                      {runResult.compileOutput}
                    </pre>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="font-mono text-xs text-ink-soft">
                      {runResult.passed}/{runResult.total} sample tests passed
                    </p>
                    {(runResult.results ?? []).map((r) => (
                      <div
                        key={r.index}
                        className={cn(
                          "rounded border p-2.5 font-mono text-xs",
                          r.passed
                            ? "border-green/40 bg-green-soft/60"
                            : "border-crimson/40 bg-crimson-soft/60"
                        )}
                      >
                        <p className="flex items-center gap-2 font-semibold">
                          {r.passed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-crimson" />
                          )}
                          Test {r.index + 1} — {r.status}
                        </p>
                        {!r.passed && (
                          <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                            <div>
                              <p className="label-caps !text-[9px]">input</p>
                              <pre className="whitespace-pre-wrap">{r.input}</pre>
                            </div>
                            <div>
                              <p className="label-caps !text-[9px]">expected</p>
                              <pre className="whitespace-pre-wrap">
                                {r.expected}
                              </pre>
                            </div>
                            <div>
                              <p className="label-caps !text-[9px]">got</p>
                              <pre className="whitespace-pre-wrap">
                                {r.actual || "(empty)"}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              ) : (
                !runError && (
                  <p className="py-4 text-center font-mono text-xs text-ink-soft">
                    Run your code against the sample tests to see results here.
                  </p>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
