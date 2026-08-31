import type {
  Answer,
  Exam,
  ExamInfo,
  MeResponse,
  MonitorRow,
  PaperResponse,
  Question,
  RegisterResponse,
  RunResponse,
  SessionDetail,
  ViolationResponse,
} from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const STUDENT_TOKEN_KEY = "exam_token";
const ADMIN_TOKEN_KEY = "admin_token";

export const tokens = {
  student: {
    get: () =>
      typeof window === "undefined"
        ? null
        : localStorage.getItem(STUDENT_TOKEN_KEY),
    set: (t: string) => localStorage.setItem(STUDENT_TOKEN_KEY, t),
    clear: () => localStorage.removeItem(STUDENT_TOKEN_KEY),
  },
  admin: {
    get: () =>
      typeof window === "undefined"
        ? null
        : localStorage.getItem(ADMIN_TOKEN_KEY),
    set: (t: string) => localStorage.setItem(ADMIN_TOKEN_KEY, t),
    clear: () => localStorage.removeItem(ADMIN_TOKEN_KEY),
  },
};

async function request<T>(
  path: string,
  opts: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  } catch {
    throw new ApiError(0, "Cannot reach the exam server — check your connection.");
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const student = <T>(path: string, opts: RequestInit = {}) =>
  request<T>(path, opts, tokens.student.get());
const admin = <T>(path: string, opts: RequestInit = {}) =>
  request<T>(path, opts, tokens.admin.get());

export const studentApi = {
  activeExam: () =>
    request<{ exam: ExamInfo | null }>("/api/v1/exam/active"),

  register: (body: {
    name: string;
    email: string;
    semester: number;
    phone?: string;
  }) =>
    request<RegisterResponse>("/api/v1/sessions", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  me: () => student<MeResponse>("/api/v1/me"),
  paper: () => student<PaperResponse>("/api/v1/me/paper"),

  saveAnswer: (
    questionId: number,
    body: {
      answerText?: string;
      selectedIndex?: number | null;
      code?: string;
      language?: string;
    }
  ) =>
    student<{ savedAt: string }>(`/api/v1/me/answers/${questionId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  violation: (kind: string, meta = "") =>
    student<ViolationResponse>("/api/v1/me/violations", {
      method: "POST",
      body: JSON.stringify({ kind, meta }),
    }),

  run: (body: {
    questionId: number;
    language: string;
    code: string;
    mode: "samples" | "custom";
    stdin?: string;
  }) =>
    student<RunResponse>("/api/v1/me/run", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  submit: () =>
    student<{ status: string }>("/api/v1/me/submit", { method: "POST" }),

  heartbeat: () =>
    student<{
      status: string;
      violationCount: number;
      endsAt: string;
      serverNow: string;
    }>("/api/v1/me/heartbeat", { method: "POST" }),
};

export const adminApi = {
  login: (email: string, password: string) =>
    request<{ token: string; email: string }>("/api/v1/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  questions: (params: { type?: string; q?: string } = {}) => {
    const sp = new URLSearchParams();
    if (params.type) sp.set("type", params.type);
    if (params.q) sp.set("q", params.q);
    sp.set("limit", "200");
    return admin<{ items: Question[]; total: number }>(
      `/api/v1/admin/questions?${sp.toString()}`
    );
  },
  question: (id: number) => admin<Question>(`/api/v1/admin/questions/${id}`),
  createQuestion: (body: unknown) =>
    admin<Question>("/api/v1/admin/questions", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateQuestion: (id: number, body: unknown) =>
    admin<Question>(`/api/v1/admin/questions/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteQuestion: (id: number) =>
    admin<{ deleted: boolean }>(`/api/v1/admin/questions/${id}`, {
      method: "DELETE",
    }),

  exams: () => admin<{ items: Exam[] }>("/api/v1/admin/exams"),
  exam: (id: number) => admin<Exam>(`/api/v1/admin/exams/${id}`),
  createExam: (body: unknown) =>
    admin<Exam>("/api/v1/admin/exams", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateExam: (id: number, body: unknown) =>
    admin<Exam>(`/api/v1/admin/exams/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  activateExam: (id: number) =>
    admin<{ status: string }>(`/api/v1/admin/exams/${id}/activate`, {
      method: "POST",
    }),
  closeExam: (id: number) =>
    admin<{ status: string }>(`/api/v1/admin/exams/${id}/close`, {
      method: "POST",
    }),
  deleteExam: (id: number) =>
    admin<{ deleted: boolean }>(`/api/v1/admin/exams/${id}`, {
      method: "DELETE",
    }),
  autoDistribute: (
    id: number,
    body: { english: number; aptitude: number; coding: number; mode: string }
  ) =>
    admin<{ distributed: boolean }>(`/api/v1/admin/exams/${id}/auto-distribute`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  setQuestions: (setId: number, questionIds: number[]) =>
    admin<{ count: number }>(`/api/v1/admin/sets/${setId}/questions`, {
      method: "PUT",
      body: JSON.stringify({ questionIds }),
    }),

  monitor: (examId: number) =>
    admin<{ items: MonitorRow[]; serverNow: string }>(
      `/api/v1/admin/exams/${examId}/sessions`
    ),
  sessionDetail: (id: number) =>
    admin<SessionDetail>(`/api/v1/admin/sessions/${id}`),
  gradeAnswer: (id: number, score: number) =>
    admin<{ score: number; manualScore: number; totalScore: number }>(
      `/api/v1/admin/answers/${id}/grade`,
      { method: "PUT", body: JSON.stringify({ score }) }
    ),

  exportCSV: async (examId: number) => {
    const res = await fetch(`${API_BASE}/api/v1/admin/exams/${examId}/export`, {
      headers: { Authorization: `Bearer ${tokens.admin.get()}` },
    });
    if (!res.ok) throw new ApiError(res.status, "export failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `exam_${examId}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

export type { Answer };
