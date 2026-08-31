"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowRight, FileQuestion, ScrollText } from "lucide-react";
import { adminApi } from "@/lib/api";
import { Card, Chip, Spinner, statusTone } from "@/components/ui";

export default function AdminDashboard() {
  const questions = useQuery({
    queryKey: ["admin", "questions", {}],
    queryFn: () => adminApi.questions(),
  });
  const exams = useQuery({
    queryKey: ["admin", "exams"],
    queryFn: adminApi.exams,
  });

  if (questions.isLoading || exams.isLoading) return <Spinner />;

  const items = questions.data?.items ?? [];
  const byType = (t: string) => items.filter((q) => q.type === t).length;
  const activeExam = exams.data?.items.find((e) => e.status === "active");

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl font-semibold">Dashboard</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          ["English", byType("english"), "amber"],
          ["Aptitude", byType("aptitude"), "ink"],
          ["Coding", byType("coding"), "green"],
        ].map(([label, count]) => (
          <Card key={label as string} className="p-5">
            <p className="label-caps">{label} questions</p>
            <p className="font-display mt-2 text-4xl font-semibold">
              {count as number}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-green" />
            <h2 className="font-display text-xl font-semibold">Live exam</h2>
          </div>
          {activeExam ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Chip tone={statusTone("active")}>active</Chip>
              <span className="font-medium">{activeExam.title}</span>
              <span className="text-sm text-ink-soft">
                {activeExam.durationMin} min · {activeExam.sessionCount}{" "}
                candidate(s)
              </span>
              <span className="ml-auto flex gap-3 text-sm">
                <Link
                  className="text-green underline"
                  href={`/admin/exams/${activeExam.id}/monitor`}
                >
                  Monitor →
                </Link>
                <Link
                  className="text-green underline"
                  href={`/admin/exams/${activeExam.id}/results`}
                >
                  Results →
                </Link>
              </span>
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">
              No exam is active. Activate one from{" "}
              <Link href="/admin/exams" className="underline">
                Exams &amp; Sets
              </Link>
              .
            </p>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link href="/admin/questions">
          <Card className="p-5 transition-transform hover:-translate-y-0.5">
            <FileQuestion className="h-5 w-5 text-ink-soft" />
            <p className="mt-2 font-medium">Manage question bank</p>
            <p className="text-sm text-ink-soft">
              {questions.data?.total ?? 0} questions ·
              English, aptitude &amp; coding <ArrowRight className="inline h-3 w-3" />
            </p>
          </Card>
        </Link>
        <Link href="/admin/exams">
          <Card className="p-5 transition-transform hover:-translate-y-0.5">
            <ScrollText className="h-5 w-5 text-ink-soft" />
            <p className="mt-2 font-medium">Exams &amp; question sets</p>
            <p className="text-sm text-ink-soft">
              {exams.data?.items.length ?? 0} exam(s) · sets A–F{" "}
              <ArrowRight className="inline h-3 w-3" />
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
