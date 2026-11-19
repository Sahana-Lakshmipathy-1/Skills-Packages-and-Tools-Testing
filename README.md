# Pattern Todos

A small web app for **tasks** and **meetings**. Built as a learning project: try modern AI coding tools on a real app, keep the product simple, and write down what each tool actually changed.

No backend. Everything stays in your browser.

---

## What you can do

| Page | What it does |
| --- | --- |
| **Tasks** (`/`) | Add tasks, mark done, filter via the URL, undo a delete |
| **Meetings** (`/meetings`) | Plan this month’s meetings — overlapping times are blocked |
| **About** (`/about`) | Short product overview |

---

## What we did (in order)

1. **Built the app** with Vite + React, following Vercel’s agent skills for structure, performance habits, and accessibility.
2. **Added meetings** with a write-first process (spec → plan → tests → code) using Superpowers.
3. **Revamped the look** with UI/UX Pro Max (palette, type, touch targets, icons).
4. **Checked security** with Semgrep.
5. **Smoke-tested the site** in a real browser with Playwright.
6. **Reviewed for AI mess & scale issues** with Spartan (ai-toolkit), then cleaned up what it flagged.

The long “why” lives in [`log.md`](./log.md).

---

## Tools we used (plain English)

| Tool | What it does here |
| --- | --- |
| **[Vercel agent skills](https://github.com/vercel-labs/agent-skills)** | Teach the AI how to structure React code, avoid slow patterns, and keep the UI accessible. |
| **[Superpowers](https://github.com/obra/superpowers)** | Force a careful build process: brainstorm → design → plan → test → ship. Used for the meeting planner. |
| **[UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)** | Pick a real product look (colors, fonts, spacing) instead of guessing a generic AI theme. |
| **[Semgrep](https://semgrep.dev)** | Scan the project for security issues in code and dependencies. Notes in [`semgrep-cli-vulnerabilities.md`](./semgrep-cli-vulnerabilities.md). |
| **[Playwright](https://playwright.dev)** | Open the app in a browser and check that pages and basic flows still work. |
| **[Spartan / ai-toolkit](https://github.com/c0x12c/ai-toolkit)** | Review agent-written code for fluff, duplication, and patterns that won’t scale — then fix them. |

---

## Run it

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

| Command | Purpose |
| --- | --- |
| `npm run build` | Production build |
| `npm test` | Unit tests |
| `npm run lint` | Lint |

### Playwright (browser tests)

First time only — install the Chromium browser Playwright uses:

```bash
npx playwright install chromium
```

Then:

```bash
npm run test:e2e          # run the smoke tests
npm run test:e2e:ui       # same tests, with Playwright’s UI
npm run test:e2e:report   # open the last HTML report
```

Or call Playwright directly:

```bash
npx playwright test
npx playwright test --ui
npx playwright show-report
```

The app is started for you (`npm run dev` on port 5173). No need to start it yourself before e2e.

---

## Want the deep dive?

Read [`log.md`](./log.md) — decisions, tradeoffs, and how each tool showed up in the code.
