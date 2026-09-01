"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, BarChart3, Shuffle } from "lucide-react";
import { adminApi, ApiError } from "@/lib/api";
import type { QuestionSet } from "@/lib/types";
import {
  Button,
  Card,
  Chip,
  ErrorNote,
  Input,
  Label,
  Select,
  Spinner,
  statusTone,
  Textarea,
} from "@/components/ui";
import SetBuilder from "@/components/admin/SetBuilder";
import QuestionUpload from "@/components/admin/QuestionUpload";

export default function ExamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const examId = Number(id);
  const qc = useQueryClient();

  const { data: exam, isLoading } = useQuery({
    queryKey: ["admin", "exam", examId],
    queryFn: () => adminApi.exam(examId),
  });

  const [title, setTitle] = useState("");
  const [durationMin, setDurationMin] = useState(60);
  const [maxViolations, setMaxViolations] = useState(3);
  const [instructions, setInstructions] = useState("");
  const [savedNote, setSavedNote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [editingSet, setEditingSet] = useState<QuestionSet | null>(null);

  const [distEnglish, setDistEnglish] = useState(2);
  const [distAptitude, setDistAptitude] = useState(8);
  const [distCoding, setDistCoding] = useState(3);
  const [distMode, setDistMode] = useState("shuffled");

  useEffect(() => {
    if (exam) {
      setTitle(exam.title);
      setDurationMin(exam.durationMin);
      setMaxViolations(exam.maxViolations);
      setInstructions(exam.instructions);
    }
  }, [exam]);

  if (isLoading || !exam) return <Spinner />;

  const refresh = () =>
    qc.invalidateQueries({ queryKey: ["admin", "exam", examId] });

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    setError(null);
    try {
      await fn();
      refresh();
      if (key === "settings") {
        setSavedNote(true);
        setTimeout(() => setSavedNote(false), 2000);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Action failed");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display min-w-0 flex-1 truncate text-3xl font-semibold">
          {exam.title}
        </h1>
        <Chip tone={statusTone(exam.status)}>{exam.status}</Chip>
        <Link href={`/admin/exams/${examId}/monitor`}>
          <Button variant="outline">
            <Activity className="h-4 w-4" /> Monitor
          </Button>
        </Link>
        <Link href={`/admin/exams/${examId}/results`}>
          <Button variant="outline">
            <BarChart3 className="h-4 w-4" /> Results
          </Button>
        </Link>
        {exam.status !== "active" ? (
          <Button
            variant="green"
            loading={busy === "activate"}
            onClick={() => run("activate", () => adminApi.activateExam(examId))}
          >
            Activate
          </Button>
        ) : (
          <Button
            variant="danger"
            loading={busy === "close"}
            onClick={() => run("close", () => adminApi.closeExam(examId))}
          >
            Close exam
          </Button>
        )}
      </div>

      <div className="mt-4">
        <ErrorNote message={error} />
      </div>

      {/* Settings */}
      <Card className="mt-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="label-caps">Exam settings</h2>
          {savedNote && (
            <span className="text-xs text-green">Saved ✓</span>
          )}
        </div>
        <div className="mt-3 grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Duration (min)</Label>
            <Input
              type="number"
              min={5}
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Max violations</Label>
            <Input
              type="number"
              min={1}
              value={maxViolations}
              onChange={(e) => setMaxViolations(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="mt-4">
          <Label>Instructions (markdown)</Label>
          <Textarea
            rows={5}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="font-mono text-[13px]"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            loading={busy === "settings"}
            onClick={() =>
              run("settings", () =>
                adminApi.updateExam(examId, {
                  title,
                  durationMin: Number(durationMin),
                  maxViolations: Number(maxViolations),
                  instructions,
                })
              )
            }
          >
            Save settings
          </Button>
        </div>
      </Card>

      {/* Auto distribute */}
      <Card className="mt-5 p-6">
        <h2 className="label-caps">Auto-distribute question sets</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Fill all six sets from the bank in one go.{" "}
          <strong>Unique</strong> gives every set different questions (needs
          count × 6 per section); <strong>shuffled</strong> gives every set the
          same sampled questions in a different order.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          {(
            [
              ["English", distEnglish, setDistEnglish],
              ["Aptitude", distAptitude, setDistAptitude],
              ["Coding", distCoding, setDistCoding],
            ] as const
          ).map(([label, value, setter]) => (
            <div key={label}>
              <Label>{label} / set</Label>
              <Input
                type="number"
                min={0}
                value={value}
                onChange={(e) => setter(Number(e.target.value))}
                className="!w-24"
              />
            </div>
          ))}
          <div>
            <Label>Mode</Label>
            <Select
              value={distMode}
              onChange={(e) => setDistMode(e.target.value)}
              className="!w-36"
            >
              <option value="shuffled">Shuffled</option>
              <option value="unique">Unique</option>
            </Select>
          </div>
          <Button
            variant="green"
            loading={busy === "distribute"}
            onClick={() =>
              run("distribute", () =>
                adminApi.autoDistribute(examId, {
                  english: distEnglish,
                  aptitude: distAptitude,
                  coding: distCoding,
                  mode: distMode,
                })
              )
            }
          >
            <Shuffle className="h-4 w-4" /> Distribute A–F
          </Button>
        </div>
        <p className="mt-2 text-xs text-amber">
          This replaces the current contents of all six sets.
        </p>
      </Card>

      {/* Import from Word */}
      <QuestionUpload exam={exam} onImported={refresh} />

      {/* Sets */}
      <h2 className="label-caps mt-8 mb-3">Question paper sets</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(exam.sets ?? []).map((set) => {
          const qs = (set.questions ?? [])
            .slice()
            .sort((a, b) => a.position - b.position);
          const marks = qs.reduce((s, sq) => s + sq.marks, 0);
          return (
            <Card key={set.id} className="flex flex-col p-4">
              <div className="flex items-center justify-between">
                <span className="stamp text-green">Set {set.label}</span>
                <span className="font-mono text-xs text-ink-soft">
                  {qs.length} Q · {marks} marks
                </span>
              </div>
              <ol className="mt-3 flex-1 space-y-1 text-xs text-ink-2">
                {qs.length === 0 && (
                  <p className="text-ink-soft">Empty — add questions.</p>
                )}
                {qs.slice(0, 6).map((sq, i) => (
                  <li key={sq.id} className="truncate">
                    <span className="font-mono text-ink-soft">{i + 1}.</span>{" "}
                    {sq.question.title}
                  </li>
                ))}
                {qs.length > 6 && (
                  <li className="text-ink-soft">… {qs.length - 6} more</li>
                )}
              </ol>
              <Button
                variant="outline"
                className="mt-3 !py-1.5 text-xs"
                onClick={() => setEditingSet(set)}
              >
                Edit questions
              </Button>
            </Card>
          );
        })}
      </div>

      {editingSet && (
        <SetBuilder
          set={editingSet}
          onClose={() => setEditingSet(null)}
          onSaved={() => {
            setEditingSet(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
