"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Plus, Search, Trash2 } from "lucide-react";
import { adminApi } from "@/lib/api";
import type { Question } from "@/lib/types";
import { cn, QUESTION_TYPE_LABEL } from "@/lib/utils";
import {
  Button,
  Chip,
  EmptyState,
  Input,
  Modal,
  Spinner,
  typeTone,
} from "@/components/ui";

const TABS = ["all", "english", "aptitude", "coding"] as const;

export default function QuestionsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("all");
  const [search, setSearch] = useState("");
  const [toDelete, setToDelete] = useState<Question | null>(null);
  const [deleting, setDeleting] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "questions", { tab, search }],
    queryFn: () =>
      adminApi.questions({
        type: tab === "all" ? undefined : tab,
        q: search || undefined,
      }),
  });

  const doDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await adminApi.deleteQuestion(toDelete.id);
      qc.invalidateQueries({ queryKey: ["admin", "questions"] });
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold">Question Bank</h1>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => adminApi.downloadQuestionTemplate().catch(() => {})}
          >
            <Download className="h-4 w-4" /> Upload template
          </Button>
          <Link href="/admin/questions/new">
            <Button variant="green">
              <Plus className="h-4 w-4" /> New question
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex rounded border border-line bg-paper-2 p-0.5">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded px-3 py-1.5 text-sm capitalize transition-colors",
                tab === t
                  ? "bg-ink text-paper"
                  : "text-ink-soft hover:text-ink"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-ink-soft" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search titles…"
            className="pl-8"
          />
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : (data?.items.length ?? 0) === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No questions yet"
            hint="Create English, aptitude and coding questions, then compose them into sets A–F."
          />
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-md border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-paper-2 text-left">
                <th className="label-caps px-4 py-2.5">Title</th>
                <th className="label-caps px-4 py-2.5">Type</th>
                <th className="label-caps px-4 py-2.5">Marks</th>
                <th className="label-caps px-4 py-2.5">Difficulty</th>
                <th className="label-caps px-4 py-2.5">Tests</th>
                <th className="w-10 px-2" />
              </tr>
            </thead>
            <tbody>
              {data!.items.map((q) => (
                <tr
                  key={q.id}
                  className="border-b border-line-soft bg-white/50 last:border-0 hover:bg-paper-2/60"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/questions/${q.id}`}
                      className="font-medium hover:underline"
                    >
                      {q.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Chip tone={typeTone(q.type)}>
                      {QUESTION_TYPE_LABEL[q.type]}
                    </Chip>
                  </td>
                  <td className="px-4 py-3 font-mono">{q.marks}</td>
                  <td className="px-4 py-3 capitalize text-ink-soft">
                    {q.difficulty || "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-ink-soft">
                    {q.type === "coding" ? (q.testCases?.length ?? 0) : "—"}
                  </td>
                  <td className="px-2 py-3">
                    <button
                      onClick={() => setToDelete(q)}
                      className="rounded p-1.5 text-ink-soft hover:bg-crimson-soft hover:text-crimson"
                      aria-label="Delete question"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete this question?"
      >
        <p className="text-sm text-ink-2">
          “{toDelete?.title}” will be removed from the bank and from any set
          that uses it. Existing student answers keep their scores.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setToDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" loading={deleting} onClick={doDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
