import { create } from "zustand";
import { studentApi } from "@/lib/api";
import type { PaperQuestion, PaperResponse, QuestionType } from "@/lib/types";

export interface AnswerDraft {
  answerText: string;
  selectedIndex: number | null;
  code: string;
  language: string;
}

export type SaveState = "idle" | "pending" | "saving" | "saved" | "error";

const AUTOSAVE_DELAY = 800;
const saveTimers = new Map<number, ReturnType<typeof setTimeout>>();

function emptyDraft(): AnswerDraft {
  return { answerText: "", selectedIndex: null, code: "", language: "" };
}

export function isAnswered(q: PaperQuestion, d: AnswerDraft | undefined): boolean {
  if (!d) return false;
  if (q.type === "english") return d.answerText.trim() !== "";
  if (q.type === "aptitude") return d.selectedIndex !== null;
  // coding: unmodified starter code doesn't count as an answer
  const code = d.code.trim();
  if (code === "") return false;
  const starters = Object.values(q.starterCode ?? {}).map((s) => s.trim());
  return !starters.includes(code);
}

interface ExamState {
  paper: PaperResponse | null;
  answers: Record<number, AnswerDraft>;
  saveStates: Record<number, SaveState>;
  currentIdx: number;
  violationCount: number;
  maxViolations: number;
  overlayKind: string | null; // strike overlay reason
  autoSubmitted: boolean;

  init: (paper: PaperResponse) => void;
  setCurrent: (idx: number) => void;
  updateAnswer: (questionId: number, patch: Partial<AnswerDraft>) => void;
  flushAll: () => Promise<void>;
  flushPending: () => Promise<void>;
  cancelPendingSaves: () => void;
  setViolationState: (count: number, max: number) => void;
  openOverlay: (kind: string) => void;
  closeOverlay: () => void;
  markAutoSubmitted: () => void;
  reset: () => void;
}

function payloadFor(type: QuestionType, d: AnswerDraft) {
  if (type === "english") return { answerText: d.answerText };
  if (type === "aptitude") return { selectedIndex: d.selectedIndex };
  return { code: d.code, language: d.language };
}

export const useExamStore = create<ExamState>((set, get) => ({
  paper: null,
  answers: {},
  saveStates: {},
  currentIdx: 0,
  violationCount: 0,
  maxViolations: 3,
  overlayKind: null,
  autoSubmitted: false,

  init: (paper) => {
    const answers: Record<number, AnswerDraft> = {};
    for (const q of paper.questions) {
      const draft = emptyDraft();
      if (q.type === "coding") {
        draft.language = "python";
        draft.code = q.starterCode?.python ?? "";
      }
      answers[q.id] = draft;
    }
    for (const saved of paper.answers) {
      const q = paper.questions.find((x) => x.id === saved.questionId);
      if (!q) continue;
      answers[saved.questionId] = {
        answerText: saved.answerText ?? "",
        selectedIndex: saved.selectedIndex,
        code:
          saved.code ||
          (q.type === "coding"
            ? q.starterCode?.[saved.language || "python"] ?? ""
            : ""),
        language: saved.language || (q.type === "coding" ? "python" : ""),
      };
    }
    set({
      paper,
      answers,
      saveStates: {},
      currentIdx: 0,
      violationCount: paper.violationCount,
      maxViolations: paper.exam.maxViolations,
      overlayKind: null,
      autoSubmitted: false,
    });
  },

  setCurrent: (idx) => set({ currentIdx: idx }),

  updateAnswer: (questionId, patch) => {
    const { answers, paper } = get();
    const q = paper?.questions.find((x) => x.id === questionId);
    if (!q) return;
    const next = { ...(answers[questionId] ?? emptyDraft()), ...patch };
    set({
      answers: { ...answers, [questionId]: next },
      saveStates: { ...get().saveStates, [questionId]: "pending" },
    });

    const existing = saveTimers.get(questionId);
    if (existing) clearTimeout(existing);
    saveTimers.set(
      questionId,
      setTimeout(async () => {
        saveTimers.delete(questionId);
        const draft = get().answers[questionId];
        set({ saveStates: { ...get().saveStates, [questionId]: "saving" } });
        try {
          await studentApi.saveAnswer(questionId, payloadFor(q.type, draft));
          set({ saveStates: { ...get().saveStates, [questionId]: "saved" } });
        } catch {
          set({ saveStates: { ...get().saveStates, [questionId]: "error" } });
        }
      }, AUTOSAVE_DELAY)
    );
  },

  flushAll: async () => {
    const { paper, answers } = get();
    if (!paper) return;
    for (const [, t] of saveTimers) clearTimeout(t);
    saveTimers.clear();
    await Promise.allSettled(
      paper.questions
        .filter((q) => isAnswered(q, answers[q.id]))
        .map((q) =>
          studentApi.saveAnswer(q.id, payloadFor(q.type, answers[q.id]))
        )
    );
  },

  // Save only the answers whose debounce timer hasn't fired yet.
  // Used right before the final strike locks the session server-side.
  flushPending: async () => {
    const { paper } = get();
    if (!paper) return;
    const pendingIds = [...saveTimers.keys()];
    for (const [, t] of saveTimers) clearTimeout(t);
    saveTimers.clear();
    await Promise.allSettled(
      pendingIds.map(async (qid) => {
        const q = paper.questions.find((x) => x.id === qid);
        const draft = get().answers[qid];
        if (!q || !draft) return;
        set({ saveStates: { ...get().saveStates, [qid]: "saving" } });
        try {
          await studentApi.saveAnswer(qid, payloadFor(q.type, draft));
          set({ saveStates: { ...get().saveStates, [qid]: "saved" } });
        } catch {
          set({ saveStates: { ...get().saveStates, [qid]: "error" } });
        }
      })
    );
  },

  // Drop scheduled saves without sending them — once the server has
  // finalized the session, any further write would just be rejected (409).
  cancelPendingSaves: () => {
    for (const [, t] of saveTimers) clearTimeout(t);
    saveTimers.clear();
  },

  setViolationState: (count, max) =>
    set({ violationCount: count, maxViolations: max }),
  openOverlay: (kind) => set({ overlayKind: kind }),
  closeOverlay: () => set({ overlayKind: null }),
  markAutoSubmitted: () => set({ autoSubmitted: true }),

  reset: () => {
    for (const [, t] of saveTimers) clearTimeout(t);
    saveTimers.clear();
    set({
      paper: null,
      answers: {},
      saveStates: {},
      currentIdx: 0,
      violationCount: 0,
      maxViolations: 3,
      overlayKind: null,
      autoSubmitted: false,
    });
  },
}));
