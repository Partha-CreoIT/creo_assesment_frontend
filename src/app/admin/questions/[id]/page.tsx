"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { Spinner } from "@/components/ui";
import QuestionForm from "@/components/admin/QuestionForm";

export default function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "question", id],
    queryFn: () => adminApi.question(Number(id)),
  });

  if (isLoading) return <Spinner />;
  if (!data) return <p className="text-ink-soft">Question not found.</p>;

  return (
    <div>
      <h1 className="font-display mb-6 text-3xl font-semibold">
        Edit question
      </h1>
      <QuestionForm initial={data} />
    </div>
  );
}
