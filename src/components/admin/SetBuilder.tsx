"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus, Search, X } from "lucide-react";
import { adminApi, ApiError } from "@/lib/api";
import type { Question, QuestionSet } from "@/lib/types";
import { QUESTION_TYPE_LABEL } from "@/lib/utils";
import {
  Button,
  Chip,
  ErrorNote,
  Input,
  Modal,
  Spinner,
  typeTone,
} from "@/components/ui";

export default function SetBuilder({
  set,
  onClose,
  onSaved,
}: {
  set: QuestionSet;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "questions", "all"],
    queryFn: () => adminApi.questions(),
  });

  const [selected, setSelected] = useState<number[]>(
    (set.questions ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((sq) => sq.questionId)
  );
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const bank = useMemo(() => {
    const items = data?.items ?? [];
    const filtered = search
      ? items.filter((q) =>
          q.title.toLowerCase().includes(search.toLowerCase())
        )
      : items;
    return ["english", "aptitude", "coding"].map((type) => ({
      type,
      items: filtered.filter((q) => q.type === type),
    }));
  }, [data, search]);

  const byId = useMemo(() => {
    const m = new Map<number, Question>();
    for (const q of data?.items ?? []) m.set(q.id, q);
    return m;
  }, [data]);

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...selected];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setSelected(next);
  };

  const totalMarks = selected.reduce(
    (sum, id) => sum + (byId.get(id)?.marks ?? 0),
    0
  );

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await adminApi.setQuestions(set.id, selected);
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Save failed");
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Edit Set ${set.label}`} wide>
      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <ErrorNote message={error} />
          <div className="grid gap-5 md:grid-cols-2">
            {/* Bank */}
            <div>
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-ink-soft" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search the bank…"
                  className="pl-8"
                />
              </div>
              <div className="max-h-[46vh] space-y-4 overflow-y-auto pr-1">
                {bank.map(({ type, items }) => (
                  <div key={type}>
                    <p className="label-caps mb-1.5">
                      {QUESTION_TYPE_LABEL[type]}
                    </p>
                    <div className="space-y-1.5">
                      {items.length === 0 && (
                        <p className="text-xs text-ink-soft">none</p>
                      )}
                      {items.map((q) => {
                        const inSet = selected.includes(q.id);
                        return (
                          <button
                            key={q.id}
                            disabled={inSet}
                            onClick={() => setSelected([...selected, q.id])}
                            className="flex w-full items-center gap-2 rounded border border-line bg-white/60 px-3 py-2 text-left text-sm hover:border-green disabled:opacity-40"
                          >
                            <Plus className="h-3.5 w-3.5 shrink-0 text-green" />
                            <span className="min-w-0 flex-1 truncate">
                              {q.title}
                            </span>
                            <span className="font-mono text-[11px] text-ink-soft">
                              {q.marks}m
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected */}
            <div>
              <p className="label-caps mb-3">
                Set {set.label} — {selected.length} questions · {totalMarks}{" "}
                marks
              </p>
              <div className="max-h-[46vh] space-y-1.5 overflow-y-auto pr-1">
                {selected.length === 0 && (
                  <p className="rounded border border-dashed border-line p-4 text-center text-xs text-ink-soft">
                    Add questions from the bank on the left.
                  </p>
                )}
                {selected.map((id, idx) => {
                  const q = byId.get(id);
                  if (!q) return null;
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-2 rounded border border-line bg-paper-2/70 px-3 py-2 text-sm"
                    >
                      <span className="font-mono text-[11px] text-ink-soft">
                        {idx + 1}.
                      </span>
                      <Chip tone={typeTone(q.type)}>{q.type[0].toUpperCase()}</Chip>
                      <span className="min-w-0 flex-1 truncate">{q.title}</span>
                      <button
                        onClick={() => move(idx, -1)}
                        className="rounded p-0.5 text-ink-soft hover:text-ink"
                        aria-label="Move up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => move(idx, 1)}
                        className="rounded p-0.5 text-ink-soft hover:text-ink"
                        aria-label="Move down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setSelected(selected.filter((x) => x !== id))
                        }
                        className="rounded p-0.5 text-ink-soft hover:text-crimson"
                        aria-label="Remove"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-3 border-t border-line pt-4">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="green" loading={saving} onClick={save}>
              Save Set {set.label}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
