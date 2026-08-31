"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { CheckCircle2, EyeOff, XCircle } from "lucide-react";
import { adminApi, ApiError } from "@/lib/api";
import type { SessionDetailItem } from "@/lib/types";
import { cn, formatDateTime, VIOLATION_LABEL } from "@/lib/utils";
import { Button, Chip, Input, Spinner, typeTone } from "@/components/ui";

function GradeControl({
  item,
  sessionId,
}: {
  item: SessionDetailItem;
  sessionId: number;
}) {
  const qc = useQueryClient();
  const [score, setScore] = useState<string>(
    item.answer?.graded ? String(item.answer.score) : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!item.answer || !item.answer.answerText.trim()) {
    return <p className="text-xs text-ink-soft">No answer — scores 0.</p>;
  }

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await adminApi.gradeAnswer(item.answer!.id, Number(score));
      qc.invalidateQueries({ queryKey: ["admin", "session", sessionId] });
      qc.invalidateQueries({ queryKey: ["admin", "monitor"] });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 flex items-center gap-2">
      <span className="label-caps !mb-0">Score</span>
      <Input
        type="number"
        min={0}
        max={item.marks}
        step={0.5}
        value={score}
        onChange={(e) => setScore(e.target.value)}
        className="!w-20 !py-1"
      />
      <span className="text-xs text-ink-soft">/ {item.marks}</span>
      <Button
        variant="green"
        className="!px-3 !py-1 text-xs"
        loading={saving}
        disabled={score === ""}
        onClick={save}
      >
        {item.answer.graded ? "Update" : "Save grade"}
      </Button>
      {item.answer.graded && (
        <Chip tone="green">graded</Chip>
      )}
      {error && <span className="text-xs text-crimson">{error}</span>}
    </div>
  );
}

export default function SessionDetailView({ sessionId }: { sessionId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "session", sessionId],
    queryFn: () => adminApi.sessionDetail(sessionId),
  });

  if (isLoading) return <Spinner />;
  if (!data) return null;

  return (
    <div className="space-y-4 border-t border-line bg-paper-2/50 p-5">
      {/* answers */}
      {data.items.map((item, i) => {
        const q = item.question;
        const a = item.answer;
        return (
          <div
            key={q.id}
            className="rounded border border-line bg-white/70 p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-ink-soft">Q{i + 1}</span>
              <Chip tone={typeTone(q.type)}>{q.type}</Chip>
              <span className="font-medium">{q.title}</span>
              <span className="ml-auto font-mono text-xs text-ink-soft">
                {a && (q.type !== "english" || a.graded) ? (
                  <strong className="text-ink">{a.score}</strong>
                ) : (
                  "–"
                )}{" "}
                / {item.marks}
              </span>
            </div>

            {q.type === "english" && (
              <>
                <div className="qbody mt-3 max-h-40 overflow-y-auto rounded border border-line-soft bg-paper p-3 text-sm">
                  {a?.answerText.trim() ? (
                    <p className="whitespace-pre-wrap">{a.answerText}</p>
                  ) : (
                    <p className="text-ink-soft">(no answer)</p>
                  )}
                </div>
                <GradeControl item={item} sessionId={sessionId} />
              </>
            )}

            {q.type === "aptitude" && (
              <div className="mt-3 space-y-1.5">
                {(q.options ?? []).map((opt, oi) => {
                  const chosen = a?.selectedIndex === oi;
                  const correct = q.correctIndex === oi;
                  return (
                    <div
                      key={oi}
                      className={cn(
                        "flex items-center gap-2 rounded border px-3 py-1.5 text-sm",
                        correct
                          ? "border-green/50 bg-green-soft"
                          : chosen
                            ? "border-crimson/50 bg-crimson-soft"
                            : "border-line-soft bg-paper"
                      )}
                    >
                      {correct ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green" />
                      ) : chosen ? (
                        <XCircle className="h-3.5 w-3.5 shrink-0 text-crimson" />
                      ) : (
                        <span className="w-3.5" />
                      )}
                      {opt}
                      {chosen && (
                        <span className="ml-auto font-mono text-[10px] text-ink-soft">
                          chosen
                        </span>
                      )}
                    </div>
                  );
                })}
                {a?.selectedIndex === null && (
                  <p className="text-xs text-ink-soft">(not attempted)</p>
                )}
              </div>
            )}

            {q.type === "coding" && (
              <div className="mt-3">
                {a?.code.trim() ? (
                  <>
                    <p className="label-caps mb-1">
                      Solution · {a.language || "python"}
                    </p>
                    <pre className="max-h-64 overflow-auto rounded bg-ink p-3 font-mono text-xs text-paper">
                      {a.code}
                    </pre>
                    {a.testResults && a.testResults.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {a.testResults.map((t) => (
                          <span
                            key={t.index}
                            title={`${t.status}${t.hidden ? " (hidden)" : ""}`}
                            className={cn(
                              "inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[10px]",
                              t.passed
                                ? "border-green/40 bg-green-soft text-green"
                                : "border-crimson/40 bg-crimson-soft text-crimson"
                            )}
                          >
                            {t.hidden && <EyeOff className="h-3 w-3" />}
                            T{t.index + 1} {t.status}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-ink-soft">(not attempted)</p>
                )}
              </div>
            )}

            {q.hint && q.type !== "coding" && (
              <div className="qbody mt-2 text-xs text-ink-soft">
                <ReactMarkdown>{`*Hint shown to students: ${q.hint}*`}</ReactMarkdown>
              </div>
            )}
          </div>
        );
      })}

      {/* violations */}
      <div className="rounded border border-line bg-white/70 p-4">
        <p className="label-caps mb-2">Violation log</p>
        {data.violations.length === 0 ? (
          <p className="text-xs text-ink-soft">Clean attempt — no violations.</p>
        ) : (
          <ul className="space-y-1 text-xs">
            {data.violations.map((v) => (
              <li key={v.id} className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    v.strike ? "bg-crimson" : "bg-amber"
                  )}
                />
                <span className={v.strike ? "text-crimson" : "text-ink-2"}>
                  {VIOLATION_LABEL[v.kind] ?? v.kind}
                </span>
                <span className="ml-auto font-mono text-ink-soft">
                  {formatDateTime(v.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
