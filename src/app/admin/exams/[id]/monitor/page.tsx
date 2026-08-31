"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Flag, RefreshCw } from "lucide-react";
import { adminApi } from "@/lib/api";
import { cn, timeAgo } from "@/lib/utils";
import { Chip, EmptyState, Spinner, statusTone } from "@/components/ui";

export default function MonitorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const examId = Number(id);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "monitor", examId],
    queryFn: () => adminApi.monitor(examId),
    refetchInterval: 5000,
  });

  return (
    <div className="max-w-6xl">
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/exams/${examId}`}
          className="text-ink-soft hover:text-ink"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-3xl font-semibold">Live monitor</h1>
        <span className="ml-auto flex items-center gap-1.5 font-mono text-xs text-ink-soft">
          <RefreshCw
            className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
          />
          refreshes every 5s
        </span>
      </div>

      {isLoading ? (
        <Spinner />
      ) : (data?.items.length ?? 0) === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No candidates yet"
            hint="Rows appear here the moment students register."
          />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-md border border-line">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-line bg-paper-2 text-left">
                <th className="label-caps px-4 py-2.5">Candidate</th>
                <th className="label-caps px-3 py-2.5">Set</th>
                <th className="label-caps px-3 py-2.5">Progress</th>
                <th className="label-caps px-3 py-2.5">Strikes</th>
                <th className="label-caps px-3 py-2.5">Status</th>
                <th className="label-caps px-3 py-2.5">Last seen</th>
                <th className="label-caps px-3 py-2.5 text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {data!.items.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-line-soft bg-white/50 last:border-0",
                    row.flagged && "bg-crimson-soft/40"
                  )}
                >
                  <td className="px-4 py-3">
                    <p className="flex items-center gap-2 font-medium">
                      {row.flagged && (
                        <Flag className="h-3.5 w-3.5 text-crimson" />
                      )}
                      {row.student.name}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {row.student.email} · sem {row.student.semester}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <span className="stamp !px-1.5 !py-0 text-[10px] text-green">
                      {row.setLabel}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-paper-3">
                        <div
                          className="h-full rounded-full bg-green transition-all"
                          style={{
                            width: `${
                              row.totalQuestions
                                ? (row.answeredCount / row.totalQuestions) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <span className="font-mono text-xs text-ink-soft">
                        {row.answeredCount}/{row.totalQuestions}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "font-mono text-sm",
                        row.violationCount > 0
                          ? "font-semibold text-crimson"
                          : "text-ink-soft"
                      )}
                    >
                      {row.violationCount}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <Chip tone={statusTone(row.status)}>
                      {row.status}
                      {row.submitKind && row.status !== "active"
                        ? ` · ${row.submitKind.replace("auto_", "auto ")}`
                        : ""}
                    </Chip>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-ink-soft">
                    {row.status === "active" ? timeAgo(row.lastSeenAt) : "—"}
                  </td>
                  <td className="px-3 py-3 text-right font-mono">
                    {row.status === "graded" ? (
                      <strong>{row.totalScore}</strong>
                    ) : (
                      <span className="text-ink-soft">—</span>
                    )}
                    {row.pendingEnglish > 0 && (
                      <p className="text-[10px] text-amber">
                        {row.pendingEnglish} to grade
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
