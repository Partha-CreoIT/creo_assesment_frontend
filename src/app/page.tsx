"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Clock, ScrollText, ShieldAlert, Terminal } from "lucide-react";
import { ApiError, studentApi, tokens } from "@/lib/api";
import { Button, Card, ErrorNote, Input, Label, Select, Spinner } from "@/components/ui";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your full name"),
  email: z.string().trim().email("Please enter a valid email"),
  semester: z.number().min(1).max(8),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || /^[0-9+\-\s]{7,15}$/.test(v), {
      message: "Enter a valid phone number (or leave it empty)",
    }),
});

type FormValues = z.infer<typeof schema>;

export default function LandingPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["activeExam"],
    queryFn: studentApi.activeExam,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { semester: 4, phone: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await studentApi.register({
        name: values.name,
        email: values.email,
        semester: values.semester,
        phone: values.phone || undefined,
      });
      tokens.student.set(res.token);
      router.push(res.resumed ? "/exam?resumed=1" : "/exam");
    } catch (e) {
      setServerError(
        e instanceof ApiError ? e.message : "Something went wrong — try again."
      );
      setSubmitting(false);
    }
  };

  const exam = data?.exam;

  return (
    <div className="dotgrid flex min-h-screen flex-col">
      {/* Masthead */}
      <header className="border-b border-ink bg-ink text-paper">
        <div className="mx-auto flex max-w-5xl items-baseline justify-between px-6 py-4">
          <h1 className="font-display text-2xl italic">Creo Assess</h1>
          <span className="label-caps !text-paper/60">
            Placement Assessment Cell
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        {isLoading ? (
          <Spinner />
        ) : !exam ? (
          <div className="rise mx-auto max-w-xl pt-16 text-center">
            <p className="font-display text-4xl">No exam is live right now.</p>
            <p className="mt-3 text-ink-soft">
              Please wait for your coordinator to activate the exam, then
              refresh this page.
            </p>
          </div>
        ) : (
          <div className="grid gap-10 md:grid-cols-[1.1fr_1fr]">
            {/* Exam notice */}
            <section className="rise">
              <p className="label-caps">Now conducting</p>
              <h2 className="font-display mt-2 text-4xl font-semibold leading-tight md:text-5xl">
                {exam.title}
              </h2>

              <div className="rule-double mt-6 pt-5">
                <ul className="space-y-3 text-sm text-ink-2">
                  <li className="flex items-center gap-3">
                    <Clock className="h-4 w-4 shrink-0 text-green" />
                    <span>
                      <strong>{exam.durationMin} minutes</strong> — the clock
                      starts the moment you register.
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <ScrollText className="h-4 w-4 shrink-0 text-green" />
                    <span>
                      Sections: <strong>English</strong> (written answers),{" "}
                      <strong>Aptitude</strong> (MCQ) and{" "}
                      <strong>Coding</strong> (Python / Java / C).
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Terminal className="h-4 w-4 shrink-0 text-green" />
                    <span>
                      Code runs against real test cases — hints and syntax
                      references are provided per question.
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-crimson" />
                    <span>
                      Fullscreen is mandatory. Switching tabs or windows is
                      recorded — {exam.maxViolations} violations submit your
                      exam automatically.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <p className="label-caps mb-2">Question paper sets</p>
                <div className="flex gap-2">
                  {["A", "B", "C", "D", "E", "F"].map((l, i) => (
                    <span
                      key={l}
                      className="stamp rise text-green"
                      style={{ animationDelay: `${0.15 + i * 0.06}s` }}
                    >
                      {l}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-ink-soft">
                  A set is assigned to you at random when you register.
                </p>
              </div>
            </section>

            {/* Hall ticket registration */}
            <section className="rise" style={{ animationDelay: "0.12s" }}>
              <Card className="p-6">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-xl font-semibold">
                    Hall Ticket
                  </h3>
                  <span className="label-caps">Registration</span>
                </div>
                <div className="rule-double mt-3 pt-4" />

                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-4"
                  noValidate
                >
                  <div>
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Ananya Sharma"
                      autoComplete="name"
                      {...register("name")}
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-crimson">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@college.edu"
                      autoComplete="email"
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-crimson">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="semester">Engineering semester</Label>
                      <Select
                        id="semester"
                        {...register("semester", { valueAsNumber: true })}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>
                            Semester {s}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone (optional)</Label>
                      <Input
                        id="phone"
                        placeholder="98765 43210"
                        autoComplete="tel"
                        {...register("phone")}
                      />
                      {errors.phone && (
                        <p className="mt-1 text-xs text-crimson">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <ErrorNote message={serverError} />

                  <Button
                    type="submit"
                    variant="green"
                    className="w-full py-3 text-base"
                    loading={submitting}
                  >
                    Register &amp; Start Exam
                  </Button>

                  <p className="text-center text-xs text-ink-soft">
                    Already started? Enter the same email to resume — your
                    clock keeps running.
                  </p>
                </form>
              </Card>
            </section>
          </div>
        )}
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 text-xs text-ink-soft">
          <span>© {new Date().getFullYear()} Creo</span>
          <a href="/admin" className="hover:text-ink hover:underline">
            Administrator sign in →
          </a>
        </div>
      </footer>
    </div>
  );
}
