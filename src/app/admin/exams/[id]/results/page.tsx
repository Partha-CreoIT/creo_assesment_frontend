"use client";

import { Fragment, use, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, Download, Flag } from "lucide-react";
import { adminApi } from "@/lib/api";
import { cn, formatDateTime } from "@/lib/utils";
import {
  Button,
  Chip,
  EmptyState,
  Spinner,
  statusTone,
} from "@/components/ui";
import SessionDetailView from "@/components/admin/SessionDetailView";

export default function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const examId = Number(id);
  const [openId, setOpenId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "monitor", examId],
    queryFn: () => adminApi.monitor(examId),
    refetchInterval: 10000,
  });

  const rows = (data?.items ?? [])
    .slice()
    .sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="max-w-6xl">
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/exams/${examId}`}
          className="text-ink-soft hover:text-ink"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-3xl font-semibold">Results</h1>
        <Button
          variant="outline"
          className="ml-auto"
          loading={exporting}
          onClick={async () => {
            setExporting(true);
            try {
              await adminApi.exportCSV(examId);
            } finally {
              setExporting(false);
            }
          }}
        >
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No attempts yet"
            hint="Results appear once students submit (or are auto-submitted)."
          />
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-md border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-paper-2 text-left">
                <th className="label-caps px-4 py-2.5">Candidate</th>
                <th className="label-caps px-3 py-2.5">Set</th>
                <th className="label-caps px-3 py-2.5">Status</th>
                <th className="label-caps px-3 py-2.5">Submitted</th>
                <th className="label-caps px-3 py-2.5 text-right">Auto</th>
                <th className="label-caps px-3 py-2.5 text-right">English</th>
                <th className="label-caps px-3 py-2.5 text-right">Total</th>
                <th className="w-10 px-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <Fragment key={row.id}>
                  <tr
                    onClick={() =>
                      setOpenId(openId === row.id ? null : row.id)
                    }
                    className={cn(
                      "cursor-pointer border-b border-line-soft bg-white/50 hover:bg-paper-2/60",
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
                        {row.student.email}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <span className="stamp !px-1.5 !py-0 text-[10px] text-green">
                        {row.setLabel}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <Chip tone={statusTone(row.status)}>{row.status}</Chip>
                      {row.pendingEnglish > 0 && (
                        <p className="mt-0.5 text-[10px] text-amber">
                          {row.pendingEnglish} english to grade
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-ink-soft">
                      {formatDateTime(row.submittedAt)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono">
                      {row.status === "graded" ? row.autoScore : "—"}
                    </td>
                    <td className="px-3 py-3 text-right font-mono">
                      {row.manualScore}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-semibold">
                      {row.status === "graded" ? row.totalScore : "—"}
                    </td>
                    <td className="px-2 py-3">
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-ink-soft transition-transform",
                          openId === row.id && "rotate-180"
                        )}
                      />
                    </td>
                  </tr>
                  {openId === row.id && (
                    <tr>
                      <td colSpan={8} className="p-0">
                        <SessionDetailView sessionId={row.id} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
