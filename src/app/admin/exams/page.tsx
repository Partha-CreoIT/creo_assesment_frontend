"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { adminApi, ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorNote,
  Input,
  Label,
  Modal,
  Spinner,
  statusTone,
  Textarea,
} from "@/components/ui";

export default function ExamsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "exams"],
    queryFn: adminApi.exams,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [durationMin, setDurationMin] = useState(60);
  const [maxViolations, setMaxViolations] = useState(3);
  const [instructions, setInstructions] = useState(
    "Welcome!\n\n- The exam runs in fullscreen; leaving it counts as a violation.\n- Sections: English, Aptitude and Coding.\n- For Java, keep the class named **Main**.\n- Answers save automatically."
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const create = async () => {
    setError(null);
    setSaving(true);
    try {
      const exam = await adminApi.createExam({
        title,
        durationMin: Number(durationMin),
        maxViolations: Number(maxViolations),
        instructions,
      });
      qc.invalidateQueries({ queryKey: ["admin", "exams"] });
      setCreateOpen(false);
      location.href = `/admin/exams/${exam.id}`;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Create failed");
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold">
          Exams &amp; Sets
        </h1>
        <Button variant="green" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New exam
        </Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : (data?.items.length ?? 0) === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No exams yet"
            hint="Create an exam — sets A to F are created automatically, ready to be filled."
          />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {data!.items.map((exam) => (
            <Link key={exam.id} href={`/admin/exams/${exam.id}`}>
              <Card className="mb-3 flex items-center gap-4 p-5 transition-transform hover:-translate-y-0.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{exam.title}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {exam.durationMin} min · max {exam.maxViolations}{" "}
                    violations · created {formatDateTime(exam.createdAt)}
                  </p>
                </div>
                <span className="font-mono text-sm text-ink-soft">
                  {exam.sessionCount ?? 0} candidate(s)
                </span>
                <Chip tone={statusTone(exam.status)}>{exam.status}</Chip>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => !saving && setCreateOpen(false)}
        title="New exam"
      >
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Campus Placement Test — March"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                min={5}
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Violations before auto-submit</Label>
              <Input
                type="number"
                min={1}
                value={maxViolations}
                onChange={(e) => setMaxViolations(Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <Label>Instructions (markdown, shown before the exam)</Label>
            <Textarea
              rows={6}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="font-mono text-[13px]"
            />
          </div>
          <ErrorNote message={error} />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="green" loading={saving} onClick={create}>
              Create exam
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
