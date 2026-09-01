"use client";

import { useRef, useState } from "react";
import { Download, Plus } from "lucide-react";
import { adminApi, ApiError, type UploadBlockError } from "@/lib/api";
import type { Exam } from "@/lib/types";
import { Button, Card, Label, Select } from "@/components/ui";

export default function QuestionUpload({
  exam,
  onImported,
}: {
  exam: Exam;
  onImported: () => void;
}) {
  const sets = (exam.sets ?? [])
    .slice()
    .sort((a, b) => a.label.localeCompare(b.label));

  const [setLabel, setSetLabel] = useState(sets[0]?.label ?? "A");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<UploadBlockError[] | null>(null);
  const [okNote, setOkNote] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setError(null);
    setDetails(null);
    setOkNote(null);
  };

  const submit = async () => {
    if (!file) {
      reset();
      setError("Choose a .docx file first.");
      return;
    }
    setBusy(true);
    reset();
    try {
      const r = await adminApi.uploadQuestions(exam.id, setLabel, file);
      setOkNote(
        `Imported ${r.created} question${r.created === 1 ? "" : "s"} into Set ${r.set}.`
      );
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      onImported();
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
        setDetails(e.details ?? null);
      } else {
        setError("Upload failed.");
      }
    } finally {
      setBusy(false);
    }
  };

  const getTemplate = () =>
    adminApi.downloadQuestionTemplate().catch(() => {
      reset();
      setError("Could not download the template.");
    });

  return (
    <Card className="mt-5 p-6">
      <h2 className="label-caps">Import questions from Word (.docx)</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Fill the template — one block per question (Type, Question, Hint,
        options / test cases) — then upload it to add those questions to a set.
        Manual entry still works.
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-4">
        <div>
          <Label>Target set</Label>
          <Select
            value={setLabel}
            onChange={(e) => setSetLabel(e.target.value)}
            className="!w-28"
          >
            {sets.map((s) => (
              <option key={s.id} value={s.label}>
                Set {s.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="min-w-0 flex-1">
          <Label>Word file</Label>
          <input
            ref={inputRef}
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-ink-soft file:mr-3 file:rounded file:border file:border-ink file:bg-transparent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink hover:file:bg-paper-2"
          />
        </div>

        <Button variant="green" loading={busy} onClick={submit}>
          <Plus className="h-4 w-4" /> Upload
        </Button>
        <Button variant="outline" onClick={getTemplate}>
          <Download className="h-4 w-4" /> Template
        </Button>
      </div>

      <p className="mt-2 text-xs text-ink-soft">
        Questions are appended to the chosen set. Nothing is imported if any
        block is invalid.
      </p>

      {okNote && (
        <div className="mt-3 rounded border border-green/40 bg-green-soft px-3 py-2 text-sm text-green">
          {okNote}
        </div>
      )}

      {error && (
        <div className="mt-3 rounded border border-crimson/40 bg-crimson-soft px-3 py-2 text-sm text-crimson">
          <p>{error}</p>
          {details && details.length > 0 && (
            <ul className="mt-1 list-disc pl-5 text-xs">
              {details.map((d, i) => (
                <li key={i}>
                  Question {d.question}: {d.error}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
