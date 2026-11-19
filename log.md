# Architecture Log — Pattern Todos

This document records **why** the app was built this way: the decisions, the thought process, what each Vercel skill contributed, how those rules showed up in code, how a later feature (meeting planner) was added with [obra/superpowers](https://github.com/obra/superpowers), how the UI was later revamped with [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill), how [Playwright](https://playwright.dev/docs/intro) was added for a simple end-to-end site demo, and how [c0x12c/ai-toolkit](https://github.com/c0x12c/ai-toolkit) (Spartan) was used to find AI slop / non-scaling patterns and harden the codebase.

---

## 1. Goal and framing

The brief was not “another todo app.” It was:

1. Install and **use** three skills from [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)
2. Build a **lean Vite + React + TypeScript** project
3. Keep the surface simple (todos + meetings + about) while making the **architecture teach the skills**

So every structural choice had to answer: *Does this demonstrate a skill rule, or is it just ceremony?*

If a pattern only mattered for Next.js RSC / server actions, it was skipped. If a pattern made the todo clearer as a teaching demo, it was required.

---

## 2. Stack decisions

| Choice | Why |
| --- | --- |
| **Vite + React 19 + TypeScript** | Fast SPA scaffold; React 19 lets us use composition-skill rules like `use()` and no `forwardRef`. |
| **Tailwind v4 via `@tailwindcss/vite`** | Utility styling without a design-system install. Keeps the demo about patterns, not shadcn/CLI setup. |
| **`react-router-dom`** | Needed for a second page (`/about`) and for URL-synced filters (`?filter=`), which the web-design skill cares about. |
| **No Redux / Zustand / React Query** | Composition skill says the **provider owns how state is managed**. A tiny `useState` + context store is enough and keeps the “lifted state” story visible. |
| **Lean app shell (not full workshop layout)** | A role-based `pages/[role]/` tree would bury the lesson. The demo should open to compound components and context, not routing orthodoxy. |

**Visual direction (original):** cool slate background + green accent, CSS variables under `:root` / dark `prefers-color-scheme`. Intentionally avoided the common AI defaults (purple gradients, cream + terracotta serif).

**Visual direction (after UI/UX Pro Max):** teal primary `#0D9488` + orange CTA `#EA580C`, Plus Jakarta Sans, flat/minimal productivity chrome. See §10.

---

## 3. High-level architecture

```
BrowserRouter
└─ AppShell (skip link, header, main)
   ├─ /           → TodoProvider → TodoPage → Todo.* compound UI
   ├─ /meetings   → MeetingProvider → MeetingPage → Meeting.* compound UI
   └─ /about      → AboutPage (product summary; skill → code mapping lives in this log)
```

**Thought process:**

- Put **routing outside** domain state so `/about` does not need a provider.
- Put **TodoProvider** / **MeetingProvider** inside their own routes so each page pays only for its context.
- Keep UI as **composed pieces** (`Todo.Form`, `Meeting.List`, …) that read context themselves — pages assemble, they do not micro-manage props.
- Keep meetings **out of** the todo model so two domains stay independently teachable.

That split is the whole composition lesson in one diagram.

---

## 4. What each skill gave us

Skills were installed into `.agents/skills/` (and Cursor’s `.cursor/skills/` for UI/UX Pro Max):

- `vercel-composition-patterns`
- `vercel-react-best-practices`
- `web-design-guidelines`
- `ui-ux-pro-max` (from [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill); also under `.cursor/skills/ui-ux-pro-max`)

### 4.1 Composition Patterns — structure first

**What the skill argues**

- Do not grow boolean props (`showFilters`, `isEditing`, …); each boolean multiplies states.
- Prefer **compound components** + shared context.
- Lift state into a provider; expose a stable **`{ state, actions, meta }`** interface.
- Prefer **children composition** over `renderX` props.
- On React 19: no `forwardRef`; prefer `use()` for context.

**How we applied it**

| Rule | Implementation |
| --- | --- |
| Lift state | `src/context/TodoContext.tsx` — only place that knows todos / undo / persistence |
| Context interface | `TodoContextValue = { state, actions, meta }` |
| Compound components | `src/components/todo/Todo.tsx` exports `Todo.Frame`, `Form`, `Filters`, `List`, `Item`, `Empty`, `UndoToast` |
| Children over render props | `TodoPage` composes `<Todo.List>{items}</Todo.List>` instead of `renderItem` |
| Avoid boolean mega-API | No `<TodoApp showFilters showEmpty … />` — the page chooses which pieces to mount |
| React 19 | `useTodoContext` uses `use(TodoContext)`; provider uses `<TodoContext value={…}>` |

**Why this shape for a todo?**

A naive todo is often one file with local state and a pile of props. That would “work,” but it would not show *why* composition scales. By forcing `Todo.*` + provider, the About page can point at real files and say: this is the pattern, not a slide deck.

### 4.2 React Best Practices — client-relevant performance habits

The skill has ~70 rules, many Next/server-specific. We **filtered to SPA-relevant ones** so the code stays honest.

| Rule (skill) | Why it mattered here | Where |
| --- | --- | --- |
| `rerender-lazy-state-init` | Avoid parsing `localStorage` on every render | `useState(() => loadTodos())` |
| `client-localstorage-schema` | Version + minimize stored payload | `{ v: 1, todos }` in `todoStorage.ts` |
| `js-cache-storage` / cached read | Do not re-parse storage repeatedly on hydrate path | module-level `cachedRead` |
| `rerender-derived-state-no-effect` | Counts/filters derived in render, not synced via effects | `deriveCounts`, `visibleTodos` via `useMemo` |
| `rerender-functional-setstate` | Stable updates under concurrent/StrictMode | `setTodos(current => …)` |
| `rerender-transitions` | Filter changes are non-urgent UI | `startTransition` in `setFilter` |
| `rerender-no-inline-components` | Avoid remounting children every parent render | Pieces defined at module scope in `Todo.tsx` |
| `rendering-content-visibility` | Cheap win if the list grows | `contentVisibility: 'auto'` on items |
| `bundle-barrel-imports` | Avoid deep re-export chains that bloat bundles | Direct imports; one compound module, not a tree of barrels |

**What we deliberately skipped**

- RSC / `React.cache` / server action auth
- `next/dynamic`, SWR dedup (no remote API)
- Virtualization libraries (skill says only when lists are large; todo demo stays small)

**Thought process:** Best-practice skills are easy to over-apply. Applying server rules in a Vite SPA would be cargo-cult. Applying lazy init, derived state, and transitions *does* change how the provider is written — so those stayed.

### 4.3 Web Design Guidelines — the UI contract

This skill fetches Vercel’s Web Interface Guidelines and audits against accessibility, forms, focus, motion, URL state, etc.

| Guideline theme | Decision in the app |
| --- | --- |
| Semantic HTML / skip link | Skip link → `#main`; `<main>`, labeled section, hierarchy on About |
| Forms | Visible `<label htmlFor>`, `name="todo"`, `autocomplete="off"`, placeholder ends with `…` |
| Focus | Global `:focus-visible` ring; no bare `outline-none` |
| URL reflects state | Filter is `?filter=all\|active\|completed` via `useSearchParams` — deep-linkable |
| Destructive actions | Delete is not permanent immediately — undo toast with `aria-live="polite"` |
| Empty states | `Todo.Empty` for zero todos / empty filter results |
| Typography | `text-pretty` on headings; `tabular-nums` on counts; ellipsis character in copy |
| Motion | `prefers-reduced-motion` kill-switch in `index.css`; transitions list properties, not `all` |
| Touch | `touch-action: manipulation` on `body` |
| Theming | `color-scheme` + `theme-color` meta; elevated surfaces via CSS variables |

**Thought process:** A “pretty” todo that fails keyboard use or loses filter on refresh fails the guidelines skill even if composition is perfect. URL sync + undo + labels were non-negotiable for that reason.

---

## 5. File map (intent per folder)

```
src/
  context/TodoContext.tsx         # ownership of todo state
  context/MeetingContext.tsx      # ownership of meeting state + form errors
  hooks/useTodoContext.ts         # React 19 use() consumer
  hooks/useMeetingContext.ts      # same pattern for meetings
  components/todo/Todo.tsx        # compound todo UI API
  components/meeting/Meeting.tsx  # compound meeting UI API
  components/icons.tsx            # inline Phosphor-style SVGs (no emoji icons)
  components/layout/…             # chrome only (header / nav)
  pages/TodoPage.tsx              # assembles Todo.*
  pages/MeetingPage.tsx           # assembles Meeting.*
  pages/AboutPage.tsx             # human-readable skill → code mapping
  utils/todoStorage.ts            # versioned todo persistence
  utils/meetingStorage.ts         # versioned meeting persistence
  utils/meetingTime.ts            # overlap / month / range pure helpers
  utils/filterFromSearch.ts       # pure URL ↔ filter helpers
  types/todo.ts / meeting.ts      # shared types, no React
  index.css                       # design tokens + ui-* + a11y/motion base
design-system/pattern-todos/      # UI/UX Pro Max MASTER.md + tokens
```

**Dependency direction we aimed for:**

- Pages → components / hooks / context
- Components → hooks / utils
- Context → utils / types
- Utils → nothing in `src` except types

That keeps the skills testable: storage, URL parsing, and overlap checks are pure functions; UI is replaceable without rewriting persistence.

---

## 6. Key behavioral decisions

### Persistence

- Hydrate once with lazy `useState` initializer.
- Persist on `todos` change.
- Schema version `v: 1` so a future shape can migrate instead of silently corrupting.

### Filtering

- Filter is **not** React state that we also mirror to the URL.
- URL is the source of truth (`filterFromSearch`); `setFilter` writes search params inside `startTransition`.

Why: the web-design skill wants shareable/deep-linked UI. Making React state primary and syncing outward invites drift. Making the URL primary matches “navigation & state” guidance.

### Delete + undo

- Immediate remove from the list (responsive).
- Keep a `pendingUndo` window (~5s) with restore by original index.
- Announce via `aria-live` so screen readers hear the outcome.

Why: guidelines forbid silent destructive actions; undo is lighter than a confirm modal for a todo demo.

### Uncontrolled add form

- Read via `FormData` on submit; `form.reset()`.
- Avoids re-rendering the whole tree on every keystroke.

Why: aligns with “prefer uncontrolled inputs when controlled work is unnecessary” from the guidelines/performance notes, and keeps the provider focused on todo entities, not draft strings.

---

## 7. How the result was achieved (process)

1. **Install skills** with `npx skills add vercel-labs/agent-skills` (skill ids: `web-design-guidelines`, `vercel-react-best-practices`, `vercel-composition-patterns`).
2. **Read skill entrypoints** (`SKILL.md` / guidelines source) and pick rules that apply to a Vite SPA.
3. **Scaffold** Vite React-TS, add Tailwind v4 plugin + `react-router-dom`.
4. **Build inside-out:** types → storage utils → provider (`state/actions/meta`) → compound `Todo.*` → pages → shell/a11y polish.
5. **Verify** with `npm run build` (and lint); adjust StrictMode-safe remove/undo (ref for current todos, no setState side effects inside updaters).

The About page exists so a reader can walk skill → decision → file without reading this log first; this log is the deeper “why.”

---

## 8. Tradeoffs accepted

| Tradeoff | Rationale |
| --- | --- |
| Single compound module (`Todo.tsx`) triggers fast-refresh lint warnings | Keeps the compound API obvious for teaching; splitting every subcomponent would dilute the lesson. |
| No virtualization | List size for this demo does not justify the dependency; `content-visibility` is the lighter step. |
| No design system / shadcn | Would pull focus into CLI primitives and workshop folder rules; skills would be harder to see. |
| Light + system dark via CSS only | Enough for `color-scheme` guidance without a theme provider. |
| Provider only on `/` | Correct isolation; means navigating away unmounts todo context (state still in `localStorage`). |

---

## 9. Meeting planner (obra/superpowers)

### Why this feature

After the todo demo existed, the next brief was: **add a simple meeting planner using [obra/superpowers](https://github.com/obra/superpowers)** — not by jumping straight into code, but by following that methodology’s skill chain.

Product shape that came out of brainstorming:

- List meetings for the **current local calendar month**
- Add with **title / start / end**
- **Block time overlaps** (`a.start < b.end && b.start < a.end`; end-to-start touch is allowed)
- Delete; persist separately from todos
- **Non-goals:** calendar grid, other months, edit, attendees, undo

### How Superpowers changed the process

| Step | Skill | What we did |
| --- | --- | --- |
| Clarify before building | `brainstorming` | One question at a time → approaches → short design → user approval |
| Spec | (same) | `docs/superpowers/specs/2026-11-18-meeting-planner-design.md` |
| Plan | `writing-plans` | Bite-sized TDD tasks in `docs/superpowers/plans/2026-11-18-meeting-planner.md` |
| Execute | `executing-plans` + `test-driven-development` | Native (inline) execution; RED → GREEN per util task; ledger under `.superpowers/sdd/` |
| Review | final whole-branch review | Fresh reviewer; one Important multi-day range display fix landed with a failing test first |

**Thought process:** Superpowers is a *process* skill pack. The Vercel skills still governed *how* the React was shaped; Superpowers governed *when* code was allowed and *how* tasks were proven.

### Architecture choice for meetings

Three approaches were laid out; **mirror the todo architecture** won:

1. New `/meetings` route + `MeetingProvider` + compound `Meeting.*` + own storage
2. Page-local `useState` only (fast, but skips the composition lesson)
3. Fold meetings into todos (couples domains)

Mirroring todos keeps the teaching story: a second domain that still looks like `{ state, actions, meta }` and compound UI, without boolean mega-props or a shared “everything” store.

### Where the rules show up

| Concern | Implementation |
| --- | --- |
| Overlap / month rules | Pure helpers in `src/utils/meetingTime.ts` (+ Vitest) |
| Persistence | `pattern-meetings` key, `{ v: 1, meetings }` in `meetingStorage.ts` |
| State ownership | `MeetingContext` — `add` returns `boolean`, sets exact `formError` strings from the plan |
| UI | `Meeting.Frame / Heading / Form / List / Item / Empty` |
| Display | `formatMeetingRange` shows end **date** when the meeting spans days (review fix) |

Exact rejected-add copy (pinned by the plan):

- `"Enter a meeting title."`
- `"End must be after start."`
- `"Start and end must be in the current month."`
- `"That time overlaps an existing meeting."`

### What we added for verification

- **Vitest** (`npm test`) for pure time/storage helpers — this repo previously had no test script.
- Manual smoke on `/meetings`: add succeeds; overlapping add shows `role="alert"` and leaves the list unchanged.

### Tradeoffs for this feature

| Tradeoff | Rationale |
| --- | --- |
| No undo on meeting delete | Spec kept meetings simpler than todos for v1 |
| No React tests for `MeetingProvider` | Plan covered provider via `tsc` + util TDD + smoke; `add` order is still easy to extract later |
| Past-month rows may linger in storage | Filtered out of `visibleMeetings`; pruning was deferred as a minor |
| Worked without git worktree | Project had no git repo at execution time; ledger substituted for commit history |

---

## 10. UI revamp with nextlevelbuilder/ui-ux-pro-max-skill

After the architecture and meeting planner were in place, the brief was to **use** [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) to revamp the UI — not to invent a new palette by hand.

### What the skill argues

- Search local design data (styles, palettes, typography, UX rules, icons, stacks) instead of guessing.
- For a product-wide look, run `--design-system`, then optionally `--persist` / `--tokens`.
- Priority order for QC: accessibility → touch/interaction → performance → style → layout → type/color → motion → forms → nav.
- Anti-patterns called out for delivery: emoji-as-icons, missing `cursor:pointer`, layout-shifting hovers, invisible focus, instant (0ms) state changes, low contrast.

### How we installed it

- Preferred path `uipro init --ai cursor` was blocked (global CLI install needed approval).
- Cloned the repo and copied `.claude/skills/ui-ux-pro-max` into:
  - `.cursor/skills/ui-ux-pro-max` (Cursor platform path)
  - `.agents/skills/ui-ux-pro-max` (alongside the Vercel skills)
- Recorded the source in `skills-lock.json`.

### Design system generation

```bash
python3 .cursor/skills/ui-ux-pro-max/scripts/search.py \
  "productivity task manager meeting planner minimal tool" \
  --design-system -p "Pattern Todos" -f markdown \
  --persist --tokens css \
  --output-dir "<project-root>"
```

That wrote `design-system/pattern-todos/`:

| File | Role |
| --- | --- |
| `MASTER.md` | Source of truth: palette, type, spacing, component specs, anti-patterns |
| `tokens.css` / `tokens.json` | Machine-readable semantic tokens |

**Product read from the skill:** Productivity Tool · Flat Design · Plus Jakarta Sans · teal focus + action orange.

### Supplemental searches used before coding

| Query | Domain / stack | What we took |
| --- | --- | --- |
| `form validation error feedback` | `ux` | Focusable error summary + inline/alert feedback |
| `touch target spacing interaction` | `ux` | ≥44px targets, ≥8px gaps |
| `minimal productivity` | `style` | Minimal/Swiss lean: clean type hierarchy, subtle 150–200ms motion |
| `accessible form button` | `html-tailwind` | Icon-button labels, consistent button sizing |
| `check trash calendar` | `icons` | Phosphor-style outline icons (inlined as SVG to stay dependency-light) |

Contrast check from the skill’s CTA guidance: **black text on `#0D9488` / `#EA580C`** clears ~4.5:1; white text on those fills does **not** — so CTAs use `--cta-ink: #000`.

### Where the rules show up

| Guidance | Implementation |
| --- | --- |
| Teal primary + orange CTA + dark pair | `src/index.css` CSS variables + `@theme inline` |
| Plus Jakarta Sans | Google Fonts `<link>` in `index.html` (not a blocking `@import` in CSS) |
| Shared control chrome | `.ui-panel`, `.ui-input`, `.ui-btn-cta`, `.ui-btn-danger`, `.ui-label` |
| 44px targets + `cursor-pointer` | `min-h-11` on controls; base `button { cursor: pointer }` |
| SVG icons, no emoji | `src/components/icons.tsx`; used in header, forms, lists, empty/error states |
| Sticky nav + focus not obscured | Sticky `SiteHeader`; `scroll-padding-top` on `html` |
| Meeting error recovery | `Meeting.Form`: focusable `role="alert"` summary, `aria-invalid`, focus moved on error |
| Atmospheric (not flat-only) bg | Soft teal/orange radial washes on `body` while keeping flat component chrome |
| About documents the skill | Fourth About section: UI/UX Pro Max |

**Thought process:** Web Design Guidelines already owned a11y/URL/undo. UI/UX Pro Max owned *product look* (palette, type, density, icon discipline) and tightened form/touch polish. We did **not** rewrite providers or compound APIs — a visual pass that breaks the composition story would miss the point of this repo.

### Tradeoffs

| Tradeoff | Rationale |
| --- | --- |
| Inline SVGs instead of `@phosphor-icons/react` | Skill recommends Phosphor; repo stays lean with no new dependency |
| Soft background gradients vs “flat = no gradients” | Flat applies to *components*; body atmosphere satisfies “don’t ship a single flat fill” without purple/cream AI defaults |
| Did not adopt landing “Product Demo + Features” page pattern | App is a tool SPA, not a marketing site; MASTER page-pattern was ignored on purpose |
| Global CLI left uninstalled | Local skill copy is enough for search.py + future agents in this project |

---

## 11. Playwright e2e demo

After the app and UI pass existed, the next brief was: **install Playwright from the [official intro](https://playwright.dev/docs/intro)** and use it to check how the site works with a simple demonstration — not a full regression suite.

### Why Playwright here

- Vitest already covers pure utils (`meetingTime`, `meetingStorage`).
- Playwright covers what unit tests do not: real browser navigation, form submit, and visible UI across routes.
- Keeping the first suite tiny matches the repo’s teaching bias: show the tool working on *this* app, not a generic `playwright.dev` sample.

### How we installed it

```bash
npm init playwright@latest -- --quiet --browser=chromium --lang=TypeScript
npx playwright install chromium
```

- Added `@playwright/test` as a devDependency.
- Chromium only (Firefox/WebKit left commented) so the demo stays lean.
- No GitHub Actions workflow — local demo first.

### Config choices

`playwright.config.ts`:

| Setting | Choice | Why |
| --- | --- | --- |
| `baseURL` | `http://localhost:5173` | Vite default; tests use paths like `/` |
| `webServer` | `npm run dev` | Auto-starts the app before e2e; reuses an existing server locally |
| `projects` | Chromium only | Fast feedback for a teaching demo |
| `reporter` | `html` | Matches the intro’s “show-report” flow |

Scripts in `package.json`:

- `test:e2e` → `playwright test`
- `test:e2e:ui` → `playwright test --ui`
- `test:e2e:report` → `playwright show-report`

`npm test` stays Vitest so unit and e2e stay separable.

### Demo coverage (`tests/example.spec.ts`)

Three checks against Pattern Todos:

1. **Home** — title / todo heading / “New Task” field visible
2. **Add task** — fill label, click “Add Task”, assert the text appears
3. **Nav** — Meetings heading + About heading via primary nav

Selectors prefer roles and labels (`getByRole`, `getByLabel`) so the suite reinforces the same a11y surface the web-design / UI skills already pushed for.

### Verification

```text
npx playwright test --reporter=list
→ 3 passed (chromium)
```

### Tradeoffs

| Tradeoff | Rationale |
| --- | --- |
| Chromium only | Enough to demonstrate Playwright; other browsers are one uncomment away |
| No meeting overlap e2e yet | Overlap rules are already pinned by Vitest; e2e stays a site smoke demo |
| `webServer` uses `dev` not `preview` | Matches local teaching flow; CI can switch to `build` + `preview` later |
| Replaced the scaffold’s playwright.dev sample | Demo must exercise *this* product, not the framework marketing site |

---

## 12. Spartan AI Toolkit (c0x12c/ai-toolkit) — slop scan + harden

After Semgrep and the feature/UI passes, the brief was: **use [c0x12c/ai-toolkit](https://github.com/c0x12c/ai-toolkit) (Spartan)** to find AI slop and code that would not scale, then install the toolkit and fix what Gate 3.5 flagged.

### What Spartan is (and is not)

Spartan is an **engineering discipline layer for AI agents** — slash commands, markdown rules, skills, quality gates, and a dual-agent `phase-reviewer` — not a deterministic regex “slop scanner” like aislop/slop-scan.

Relevant pieces we used:

| Piece | Role |
| --- | --- |
| `/spartan:gate-review` | Gate 3.5: builder self-check + separate reviewer must both accept |
| `/spartan:fe-review` | Frontend checklist (TS strictness, component size, a11y, perf) |
| `agents/phase-reviewer` | SOLID / clean code / no unnecessary complexity / no copy-paste |
| `rules/frontend-react/FRONTEND.md` | Build check, null safety, form/API patterns |
| `templates/quality-gates.md` | Spec → plan → build → dual review → ship |

### How we installed it

```bash
npx @c0x12c/ai-toolkit@latest --local --agent=claude-code --packs=frontend-react
```

| Attempt | Result |
| --- | --- |
| `--agent=cursor` → `.cursor/rules/` | **Blocked** — project `.cursor` is a read-only mount in this environment |
| `--agent=claude-code` → `.claude/` | **Succeeded** — commands, rules, skills, `phase-reviewer`, assembled `CLAUDE.md` |

Installer also appended `.spartan/ai.env` to `.gitignore` (API keys for optional design tooling).

Installed locally under `.claude/`:

- **37 commands** (core + frontend-react), including `gate-review`, `fe-review`, `pr-ready`, `js-security`
- **4 rules** — `core/NAMING_CONVENTIONS`, `TIMEZONE`, `SKILL_AUTHORING`, `frontend-react/FRONTEND`
- **2 skills** — `browser-qa`, `js-security-audit`
- **1 agent** — `phase-reviewer`

### What the Gate 3.5 review found

Verdict: **NEEDS CHANGES**. Reviewer focused on duplication, monolithic context re-renders, and sync I/O — not style nits.

| Severity | Finding |
| --- | --- |
| HIGH | Every list `Item` subscribed to the full `{ state, actions, meta }` value → one toggle re-rendered all rows |
| MEDIUM | Near-clone `todoStorage` / `meetingStorage` and `Todo.*` / `Meeting.*` shells |
| MEDIUM | `localStorage.setItem` on every mutation (including toggles / undo) |
| MEDIUM | `MeetingContext.add` closed over `meetings` → unstable `actions` + O(n) conflict scan |
| MEDIUM | Dead API (`clearFormError`, unused `CheckIcon`) |
| MEDIUM | Date parsing lived in `Meeting.Form`; inline `style={{ contentVisibility }}`; no `strict` in app tsconfig |
| MEDIUM | About page read as a skill manifesto (“AI slop” demo copy), not product About |

**What was already clean:** route-scoped providers, typed models (no `any`), overlap rules in pure utils + Vitest, thin page composers, a11y basics (labels, alert focus, skip link).

### What we changed in code (after install)

| Finding | Fix |
| --- | --- |
| Duplicate storage | `src/utils/versionedStorage.ts` + thin domain wrappers |
| Full list re-renders | Split `*ActionsContext` / `*DataContext`; `memo` on `Todo.Item` / `Meeting.Item`; `useTodoActions` / `useMeetingActions` |
| Storage thrash | `schedulePersist` (300ms debounce) + flush on unmount |
| Unstable `add` | `meetingsRef` + stable `useCallback` with `[]` deps |
| Shared shells | `src/components/pattern/PatternShell.tsx` (`PatternFrame` / `List` / `Empty`) |
| Form parsing in UI | `parseMeetingFormInput` in `meetingTime.ts` (+ test) |
| Inline style | `.list-row` in `index.css` (`content-visibility` + intrinsic size) |
| Dead code | Removed `clearFormError` and `CheckIcon` |
| About slop | Product-facing copy (Tasks / Meetings / Local-first) |
| Strict TS | `"strict": true` in `tsconfig.app.json` |
| Vitest noise | `include: ['src/**/*.test.ts']` so Playwright specs are not picked up by `npm test` |

### Verification

```text
npm test          → 17 passed (src unit tests)
npm run build     → tsc -b + vite build OK
npm run lint      → oxlint (existing compound-export fast-refresh warnings only)
```

### Thought process

- Vercel skills taught *how to build*; Spartan taught *how to review what agents ship*.
- Cursor install was preferred for this repo, but a RO `.cursor` mount made Claude Code’s local `.claude/` the workable install path — same rules/commands, different agent folder.
- Fixes stayed surgical: keep `{ state, actions, meta }` and compound APIs; split subscription and dedupe storage so the teaching story scales instead of being rewritten.

### Tradeoffs

| Tradeoff | Rationale |
| --- | --- |
| Toolkit under `.claude/` not `.cursor/rules/` | Environment could not mkdir/write `.cursor/rules` |
| Did not extract a full shared Heading | Domain headings differ (month label vs filter copy); only Frame/List/Empty were true clones |
| Debounce 300ms, not idle-only | Simple, predictable; flush on unmount avoids lost writes |
| Left `searchFromFilter` util exported | Still the inverse of `filterFromSearch`; setFilter now writes params directly |

---

## 13. Bottom line

The app is intentionally small. Complexity was spent where the skills demand it:

- **Composition** decided the component API and state ownership (todos *and* meetings).
- **React best practices** decided how that state initializes, derives, and transitions.
- **Web design guidelines** decided accessibility, URL behavior, and destructive-action UX.
- **Superpowers** decided that the meeting planner earned a written spec, a TDD plan, and a review gate before it counted as done.
- **UI/UX Pro Max** decided the product palette, typography, touch/feedback polish, and form-error pattern — via a persisted design system, not ad-hoc restyling.
- **Playwright** decided how we smoke-test the real site in a browser: tiny chromium e2e against home / add-task / nav, separate from Vitest utils.
- **Spartan (ai-toolkit)** decided how we catch AI slop and non-scaling patterns: Gate 3.5 dual review → shared storage, split action context, debounced persist, and dead-code cleanup without abandoning the composition lesson.

If you change the app later, prefer changes that keep those stories intact over adding features that need boolean props or orphan client state.
