"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { adminApi, ApiError } from "@/lib/api";
import type { Question, QuestionType, TestCase } from "@/lib/types";
import { cn, LANGUAGE_LABEL, QUESTION_TYPE_LABEL } from "@/lib/utils";
import {
  Button,
  Card,
  ErrorNote,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui";

const TYPES: QuestionType[] = ["english", "aptitude", "coding"];
const TYPE_HINT: Record<QuestionType, string> = {
  english:
    "A passage plus a written-answer question. Graded manually by you after submission.",
  aptitude: "Multiple-choice question, auto-graded.",
  coding:
    "Programming task compiled & run against test cases in Python, Java or C.",
};

interface FormState {
  type: QuestionType;
  title: string;
  body: string;
  hint: string;
  marks: number;
  difficulty: string;
  options: string[];
  correctIndex: number | null;
  starterCode: Record<string, string>;
  syntaxNote: string;
  timeLimitMs: number;
  testCases: TestCase[];
}

function fromQuestion(q?: Question): FormState {
  return {
    type: q?.type ?? "aptitude",
    title: q?.title ?? "",
    body: q?.body ?? "",
    hint: q?.hint ?? "",
    marks: q?.marks ?? 2,
    difficulty: q?.difficulty ?? "easy",
    options: q?.options?.length ? [...q.options] : ["", "", "", ""],
    correctIndex: q?.correctIndex ?? null,
    starterCode: {
      python: q?.starterCode?.python ?? "",
      java: q?.starterCode?.java ?? "",
      c: q?.starterCode?.c ?? "",
    },
    syntaxNote: q?.syntaxNote ?? "",
    timeLimitMs: q?.timeLimitMs || 3000,
    testCases: q?.testCases?.length
      ? q.testCases.map((t) => ({ ...t }))
      : [{ input: "", expected: "", hidden: false, weight: 1 }],
  };
}

export default function QuestionForm({ initial }: { initial?: Question }) {
  const router = useRouter();
  const [f, setF] = useState<FormState>(() => fromQuestion(initial));
  const [codeTab, setCodeTab] = useState("python");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const patch = (p: Partial<FormState>) => setF((s) => ({ ...s, ...p }));

  const save = async () => {
    setError(null);
    setSaving(true);
    const payload = {
      type: f.type,
      title: f.title,
      body: f.body,
      hint: f.hint,
      marks: Number(f.marks),
      difficulty: f.difficulty,
      options:
        f.type === "aptitude"
          ? f.options.map((o) => o.trim()).filter(Boolean)
          : undefined,
      correctIndex: f.type === "aptitude" ? f.correctIndex : undefined,
      starterCode:
        f.type === "coding"
          ? Object.fromEntries(
              Object.entries(f.starterCode).filter(([, v]) => v.trim() !== "")
            )
          : undefined,
      syntaxNote: f.type === "coding" ? f.syntaxNote : undefined,
      timeLimitMs: f.type === "coding" ? Number(f.timeLimitMs) : undefined,
      testCases:
        f.type === "coding"
          ? f.testCases
              .filter((t) => t.expected.trim() !== "" || t.input.trim() !== "")
              .map((t) => ({ ...t, weight: Number(t.weight) || 1 }))
          : undefined,
    };
    try {
      if (initial) await adminApi.updateQuestion(initial.id, payload);
      else await adminApi.createQuestion(payload);
      router.push("/admin/questions");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Save failed");
      setSaving(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <ErrorNote message={error} />

      {/* type selector */}
      {!initial && (
        <div className="grid gap-3 sm:grid-cols-3">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => patch({ type: t })}
              className={cn(
                "rounded-md border p-4 text-left transition-all",
                f.type === t
                  ? "border-green bg-green-soft shadow-[2px_2px_0_var(--color-line)]"
                  : "border-line bg-white/60 hover:border-ink-soft"
              )}
            >
              <p className="font-medium">{QUESTION_TYPE_LABEL[t]}</p>
              <p className="mt-1 text-xs text-ink-soft">{TYPE_HINT[t]}</p>
            </button>
          ))}
        </div>
      )}

      <Card className="space-y-4 p-6">
        <div>
          <Label>Title</Label>
          <Input
            value={f.title}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="Short title shown in lists"
          />
        </div>
        <div>
          <Label>
            {f.type === "english"
              ? "Passage + question (markdown, use > for the passage)"
              : "Question body (markdown supported)"}
          </Label>
          <Textarea
            rows={f.type === "english" ? 10 : 6}
            value={f.body}
            onChange={(e) => patch({ body: e.target.value })}
            className="font-mono text-[13px]"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Marks</Label>
            <Input
              type="number"
              min={1}
              value={f.marks}
              onChange={(e) => patch({ marks: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Difficulty</Label>
            <Select
              value={f.difficulty}
              onChange={(e) => patch({ difficulty: e.target.value })}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </Select>
          </div>
          {f.type === "coding" && (
            <div>
              <Label>Time limit (ms)</Label>
              <Input
                type="number"
                min={500}
                step={500}
                value={f.timeLimitMs}
                onChange={(e) => patch({ timeLimitMs: Number(e.target.value) })}
              />
            </div>
          )}
        </div>
        <div>
          <Label>Hint (optional, shown to students on demand)</Label>
          <Textarea
            rows={2}
            value={f.hint}
            onChange={(e) => patch({ hint: e.target.value })}
          />
        </div>
      </Card>

      {/* MCQ options */}
      {f.type === "aptitude" && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <Label className="!mb-0">Options — tick the correct one</Label>
            <Button
              variant="ghost"
              className="!px-2 !py-1 text-xs"
              onClick={() => patch({ options: [...f.options, ""] })}
              disabled={f.options.length >= 6}
            >
              <Plus className="h-3.5 w-3.5" /> Add option
            </Button>
          </div>
          <div className="mt-3 space-y-2">
            {f.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-3">
                <input
                  type="radio"
                  name="correct"
                  checked={f.correctIndex === i}
                  onChange={() => patch({ correctIndex: i })}
                  className="h-4 w-4 accent-green"
                  aria-label={`Mark option ${i + 1} correct`}
                />
                <Input
                  value={opt}
                  onChange={(e) => {
                    const options = [...f.options];
                    options[i] = e.target.value;
                    patch({ options });
                  }}
                  placeholder={`Option ${i + 1}`}
                />
                <button
                  onClick={() => {
                    const options = f.options.filter((_, x) => x !== i);
                    patch({
                      options,
                      correctIndex:
                        f.correctIndex === i
                          ? null
                          : f.correctIndex !== null && f.correctIndex > i
                            ? f.correctIndex - 1
                            : f.correctIndex,
                    });
                  }}
                  className="rounded p-1.5 text-ink-soft hover:bg-crimson-soft hover:text-crimson"
                  disabled={f.options.length <= 2}
                  aria-label="Remove option"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Coding extras */}
      {f.type === "coding" && (
        <>
          <Card className="p-6">
            <Label>Starter code (loaded into the editor per language)</Label>
            <div className="mt-2 flex gap-1 border-b border-line">
              {Object.keys(LANGUAGE_LABEL).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setCodeTab(lang)}
                  className={cn(
                    "px-3 py-1.5 font-mono text-xs",
                    codeTab === lang
                      ? "border-b-2 border-green font-semibold text-ink"
                      : "text-ink-soft"
                  )}
                >
                  {LANGUAGE_LABEL[lang]}
                </button>
              ))}
            </div>
            <Textarea
              rows={8}
              value={f.starterCode[codeTab]}
              onChange={(e) =>
                patch({
                  starterCode: { ...f.starterCode, [codeTab]: e.target.value },
                })
              }
              className="mt-2 font-mono text-[13px]"
              spellCheck={false}
            />
            <div className="mt-4">
              <Label>Syntax note (markdown — shown in a “Syntax help” tab)</Label>
              <Textarea
                rows={5}
                value={f.syntaxNote}
                onChange={(e) => patch({ syntaxNote: e.target.value })}
                className="font-mono text-[13px]"
              />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <Label className="!mb-0">
                Test cases — hidden ones run only at final grading
              </Label>
              <Button
                variant="ghost"
                className="!px-2 !py-1 text-xs"
                onClick={() =>
                  patch({
                    testCases: [
                      ...f.testCases,
                      { input: "", expected: "", hidden: true, weight: 1 },
                    ],
                  })
                }
              >
                <Plus className="h-3.5 w-3.5" /> Add test case
              </Button>
            </div>
            <div className="mt-3 space-y-3">
              {f.testCases.map((tc, i) => (
                <div
                  key={i}
                  className="rounded border border-line bg-paper-2/60 p-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="!text-[10px]">Input (stdin)</Label>
                      <Textarea
                        rows={2}
                        value={tc.input}
                        onChange={(e) => {
                          const testCases = [...f.testCases];
                          testCases[i] = { ...tc, input: e.target.value };
                          patch({ testCases });
                        }}
                        className="font-mono text-xs"
                        spellCheck={false}
                      />
                    </div>
                    <div>
                      <Label className="!text-[10px]">Expected output</Label>
                      <Textarea
                        rows={2}
                        value={tc.expected}
                        onChange={(e) => {
                          const testCases = [...f.testCases];
                          testCases[i] = { ...tc, expected: e.target.value };
                          patch({ testCases });
                        }}
                        className="font-mono text-xs"
                        spellCheck={false}
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs">
                    <label className="flex cursor-pointer items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={tc.hidden}
                        onChange={(e) => {
                          const testCases = [...f.testCases];
                          testCases[i] = { ...tc, hidden: e.target.checked };
                          patch({ testCases });
                        }}
                        className="h-3.5 w-3.5 accent-green"
                      />
                      Hidden
                    </label>
                    <label className="flex items-center gap-1.5">
                      Weight
                      <Input
                        type="number"
                        min={1}
                        value={tc.weight}
                        onChange={(e) => {
                          const testCases = [...f.testCases];
                          testCases[i] = {
                            ...tc,
                            weight: Number(e.target.value),
                          };
                          patch({ testCases });
                        }}
                        className="!w-16 !py-1"
                      />
                    </label>
                    <button
                      onClick={() =>
                        patch({
                          testCases: f.testCases.filter((_, x) => x !== i),
                        })
                      }
                      className="ml-auto rounded p-1 text-ink-soft hover:bg-crimson-soft hover:text-crimson"
                      disabled={f.testCases.length <= 1}
                      aria-label="Remove test case"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      <div className="flex justify-end gap-3 pb-10">
        <Button variant="ghost" onClick={() => router.push("/admin/questions")}>
          Cancel
        </Button>
        <Button variant="green" loading={saving} onClick={save}>
          {initial ? "Save changes" : "Create question"}
        </Button>
      </div>
    </div>
  );
}
