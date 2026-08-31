# Creo Assess — Frontend

Next.js app for Creo Assess, a proctored mock-test platform. Students register (name, email, semester, optional phone), get a randomly assigned question-paper set (A–F), and take a fullscreen exam with three sections — English (written), Aptitude (MCQ), and Coding (Python / Java / C with a Monaco editor and a real test runner). Admins manage the question bank, compose sets, watch a live monitor, grade English answers, and export results.

Backend lives in the sibling repo `exam_taker_bc` (Go) — start it first.

## Quick start

```bash
# backend first (see ../exam_taker_bc/README.md):
#   docker compose up -d && go run ./cmd/seed && go run ./cmd/server

npm install
npm run dev          # http://localhost:3000
```

`NEXT_PUBLIC_API_URL` (default `http://localhost:8080`) points at the Go API — see `.env.local`.

- Student portal: `http://localhost:3000`
- Admin panel: `http://localhost:3000/admin` (seeded login: `admin@example.com` / `admin123`)

## What's where

```
src/
├── app/
│   ├── page.tsx                    # landing + hall-ticket registration
│   ├── exam/page.tsx               # instructions gate → fullscreen → exam room
│   ├── exam/submitted/page.tsx     # confirmation (manual / time / violations)
│   └── admin/                      # login, dashboard, question bank,
│                                   # exams + set builder, monitor, results
├── components/
│   ├── exam/                       # ExamRoom, palette, timer, MCQ/English/Coding
│   │                               # views, run console, violation overlay
│   ├── admin/                      # QuestionForm, SetBuilder, SessionDetailView
│   └── ui.tsx                      # button/input/card/modal/chip primitives
├── hooks/
│   ├── useProctor.ts               # strikes, blocked copy/paste, heartbeat
│   └── useExamTimer.ts             # server-synced countdown
├── store/examStore.ts              # answers, autosave (800ms debounce), strikes
└── lib/                            # typed API client, types, utils
```

## Behaviour notes

- **Proctoring**: the exam runs fullscreen. Tab switches, window blur and fullscreen exits are strikes — the server counts them; on the 3rd (configurable per exam) the attempt auto-submits and is flagged. Copy/paste/right-click are blocked and logged but don't strike. Detection is deterrence-level: a browser cannot physically prevent leaving.
- **Resume**: the session token lives in `localStorage`; a refresh or crash re-enters via the instructions gate with the original server-side clock. Registering again with the same email resumes too.
- **Autosave**: every change saves after an 800ms debounce; the header shows Saved / Saving / Retrying.
- **Timer**: server-authoritative (`endsAt` + server-time offset); at zero the client flushes answers and submits — the backend sweeper is the backstop.
- **Monaco** loads from its CDN; if it can't (offline lab), the editor falls back to a plain textarea after 8s so the exam still works.

## Design

"Examination hall" system: warm paper surfaces with a dot grid, ink text, examiner's-green accent, amber warnings, crimson strikes. Fraunces (display) + Archivo (UI) + IBM Plex Mono (timers, labels, code) via `next/font`. Tokens live in `src/app/globals.css` under `@theme`.
