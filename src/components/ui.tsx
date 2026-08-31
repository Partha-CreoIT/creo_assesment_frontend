"use client";

import { cn } from "@/lib/utils";
import { Loader2, X } from "lucide-react";
import { type ReactNode, useEffect } from "react";

/* ── Buttons ─────────────────────────────────────────────── */

type ButtonVariant = "primary" | "green" | "danger" | "outline" | "ghost";

export function Button({
  variant = "primary",
  className,
  loading,
  disabled,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
}) {
  const styles: Record<ButtonVariant, string> = {
    primary:
      "bg-ink text-paper hover:bg-ink-2 border border-ink shadow-[2px_2px_0_var(--color-line)]",
    green:
      "bg-green text-paper hover:bg-green-2 border border-green shadow-[2px_2px_0_var(--color-line)]",
    danger:
      "bg-crimson text-paper hover:bg-crimson-2 border border-crimson",
    outline:
      "bg-transparent text-ink border border-ink hover:bg-paper-2",
    ghost: "bg-transparent text-ink-soft hover:text-ink hover:bg-paper-2",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded px-4 py-2 text-sm font-medium transition-all",
        "active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        styles[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

/* ── Form fields ─────────────────────────────────────────── */

export function Label({
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("label-caps mb-1.5 block", className)} {...props}>
      {children}
    </label>
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded border border-line bg-white/70 px-3 py-2 text-sm text-ink",
        "placeholder:text-ink-soft/60 focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded border border-line bg-white/70 px-3 py-2 text-sm text-ink",
        "placeholder:text-ink-soft/60 focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20",
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded border border-line bg-white/70 px-3 py-2 text-sm text-ink",
        "focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

/* ── Surfaces ────────────────────────────────────────────── */

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-line bg-white/60 shadow-[3px_3px_0_var(--color-line-soft)]",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ── Chips & badges ──────────────────────────────────────── */

const chipTones: Record<string, string> = {
  green: "bg-green-soft text-green border-green/30",
  amber: "bg-amber-soft text-amber border-amber/30",
  crimson: "bg-crimson-soft text-crimson border-crimson/30",
  ink: "bg-paper-2 text-ink-2 border-line",
};

export function Chip({
  tone = "ink",
  className,
  children,
}: {
  tone?: keyof typeof chipTones;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px] font-medium",
        chipTones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function typeTone(type: string): keyof typeof chipTones {
  if (type === "english") return "amber";
  if (type === "coding") return "green";
  return "ink";
}

export function statusTone(status: string): keyof typeof chipTones {
  if (status === "active") return "green";
  if (status === "grading") return "amber";
  if (status === "graded") return "ink";
  if (status === "closed") return "crimson";
  return "ink";
}

/* ── Modal ───────────────────────────────────────────────── */

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose?: () => void;
  title?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open || !onClose) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative max-h-[88vh] w-full overflow-y-auto rounded-md border border-ink bg-paper p-6 shadow-[6px_6px_0_rgba(28,26,22,0.35)]",
          wide ? "max-w-4xl" : "max-w-lg"
        )}
      >
        {(title || onClose) && (
          <div className="mb-4 flex items-start justify-between gap-4">
            {title && (
              <h3 className="font-display text-xl font-semibold">{title}</h3>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="rounded p-1 text-ink-soft hover:bg-paper-2 hover:text-ink"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/* ── Misc ────────────────────────────────────────────────── */

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-12", className)}>
      <Loader2 className="h-6 w-6 animate-spin text-ink-soft" />
    </div>
  );
}

export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="rounded-md border border-dashed border-line bg-paper-2/50 px-6 py-12 text-center">
      <p className="font-display text-lg text-ink-2">{title}</p>
      {hint && <p className="mt-1 text-sm text-ink-soft">{hint}</p>}
    </div>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded border border-crimson/40 bg-crimson-soft px-3 py-2 text-sm text-crimson">
      {message}
    </div>
  );
}
