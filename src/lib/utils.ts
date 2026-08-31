import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** mm:ss or h:mm:ss for the countdown */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = m.toString().padStart(2, "0");
  const ss = sec.toString().padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString();
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const QUESTION_TYPE_LABEL: Record<string, string> = {
  english: "English",
  aptitude: "Aptitude",
  coding: "Coding",
};

export const LANGUAGE_LABEL: Record<string, string> = {
  python: "Python 3",
  java: "Java",
  c: "C",
};

export const VIOLATION_LABEL: Record<string, string> = {
  tab_hidden: "Switched tab / minimised window",
  window_blur: "Clicked outside the exam window",
  fullscreen_exit: "Left fullscreen",
  copy: "Copy attempt",
  paste: "Paste attempt",
  cut: "Cut attempt",
  contextmenu: "Right-click",
  reload: "Page reload",
};
