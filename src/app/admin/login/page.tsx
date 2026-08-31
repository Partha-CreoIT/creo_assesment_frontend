"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { adminApi, ApiError, tokens } from "@/lib/api";
import { Button, Card, ErrorNote, Input, Label } from "@/components/ui";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await adminApi.login(email, password);
      tokens.admin.set(res.token);
      router.replace("/admin");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Login failed — try again."
      );
      setLoading(false);
    }
  };

  return (
    <div className="dotgrid flex min-h-screen items-center justify-center p-6">
      <div className="rise w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="font-display text-3xl italic">Creo Assess</h1>
          <p className="label-caps mt-1">Examiner&apos;s Office</p>
        </div>
        <Card className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
            <ErrorNote message={error} />
            <Button type="submit" className="w-full py-2.5" loading={loading}>
              <KeyRound className="h-4 w-4" /> Sign in
            </Button>
          </form>
        </Card>
        <p className="mt-4 text-center text-xs text-ink-soft">
          <a href="/" className="underline hover:text-ink">
            ← Back to the student portal
          </a>
        </p>
      </div>
    </div>
  );
}
