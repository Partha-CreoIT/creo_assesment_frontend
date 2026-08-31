export type QuestionType = "english" | "aptitude" | "coding";
export type Language = "python" | "java" | "c";

export interface TestCase {
  id?: number;
  input: string;
  expected: string;
  hidden: boolean;
  weight: number;
}

export interface Question {
  id: number;
  type: QuestionType;
  title: string;
  body: string;
  hint: string;
  marks: number;
  difficulty: string;
  options: string[] | null;
  correctIndex: number | null;
  starterCode: Record<string, string> | null;
  syntaxNote: string;
  timeLimitMs: number;
  memoryLimitKb: number;
  testCases: TestCase[] | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExamInfo {
  id: number;
  title: string;
  instructions: string;
  durationMin: number;
  maxViolations: number;
}

export interface Exam extends ExamInfo {
  status: "draft" | "active" | "closed";
  createdAt: string;
  updatedAt: string;
  sets?: QuestionSet[];
  sessionCount?: number;
}

export interface SetQuestion {
  id: number;
  setId: number;
  questionId: number;
  position: number;
  marks: number;
  question: Question;
}

export interface QuestionSet {
  id: number;
  examId: number;
  label: string;
  questions?: SetQuestion[];
}

export interface RegisterResponse {
  token: string;
  resumed: boolean;
  endsAt: string;
  serverNow: string;
  exam: ExamInfo;
}

export interface SampleTest {
  input: string;
  expected: string;
}

export interface PaperQuestion {
  id: number;
  type: QuestionType;
  title: string;
  body: string;
  hint: string;
  marks: number;
  position: number;
  difficulty: string;
  options?: string[];
  starterCode?: Record<string, string>;
  syntaxNote?: string;
  timeLimitMs?: number;
  sampleTests?: SampleTest[];
  hiddenTestCount?: number;
}

export interface SavedAnswer {
  questionId: number;
  answerText: string;
  selectedIndex: number | null;
  code: string;
  language: string;
}

export interface PaperResponse {
  exam: ExamInfo;
  studentName: string;
  setLabel: string;
  status: string;
  violationCount: number;
  startedAt: string;
  endsAt: string;
  serverNow: string;
  questions: PaperQuestion[];
  answers: SavedAnswer[];
}

export interface MeResponse {
  status: string;
  studentName: string;
  setLabel: string;
  violationCount: number;
  maxViolations: number;
  submitKind: string;
  startedAt: string;
  endsAt: string;
  submittedAt: string | null;
  serverNow: string;
  exam: ExamInfo;
}

export interface ViolationResponse {
  violationCount: number;
  maxViolations: number;
  strike: boolean;
  autoSubmitted: boolean;
}

export interface RunTestResult {
  index: number;
  input: string;
  expected: string;
  actual: string;
  status: string;
  passed: boolean;
}

export interface RunResponse {
  mode: "samples" | "custom";
  compileOk: boolean;
  compileOutput?: string;
  results?: RunTestResult[];
  passed?: number;
  total?: number;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  timedOut?: boolean;
}

export interface StoredTestResult {
  index: number;
  hidden: boolean;
  input: string;
  expected: string;
  actual: string;
  status: string;
  passed: boolean;
  weight: number;
}

export interface Answer {
  id: number;
  sessionId: number;
  questionId: number;
  type: QuestionType;
  answerText: string;
  selectedIndex: number | null;
  code: string;
  language: string;
  score: number;
  graded: boolean;
  testResults: StoredTestResult[] | null;
  updatedAt: string;
}

export interface Student {
  id: number;
  name: string;
  email: string;
  semester: number;
  phone: string;
}

export interface MonitorRow {
  id: number;
  student: Student;
  setLabel: string;
  status: "active" | "grading" | "graded";
  submitKind: string;
  flagged: boolean;
  violationCount: number;
  answeredCount: number;
  totalQuestions: number;
  pendingEnglish: number;
  autoScore: number;
  manualScore: number;
  totalScore: number;
  startedAt: string;
  endsAt: string;
  submittedAt: string | null;
  lastSeenAt: string;
}

export interface Violation {
  id: number;
  sessionId: number;
  kind: string;
  strike: boolean;
  meta: string;
  createdAt: string;
}

export interface SessionDetailItem {
  position: number;
  marks: number;
  question: Question;
  answer: Answer | null;
}

export interface SessionDetail {
  session: {
    id: number;
    status: string;
    submitKind: string;
    flagged: boolean;
    violationCount: number;
    autoScore: number;
    manualScore: number;
    totalScore: number;
    startedAt: string;
    endsAt: string;
    submittedAt: string | null;
    student: Student;
  };
  examTitle: string;
  setLabel: string;
  items: SessionDetailItem[];
  violations: Violation[];
}
