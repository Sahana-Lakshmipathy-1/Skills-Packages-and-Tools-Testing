# Simple Meeting Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/meetings` page that lists this month’s meetings, lets the user add title/start/end, blocks time overlaps, deletes meetings, and persists them in localStorage — mirroring the todo architecture.

**Architecture:** Separate domain from todos: `Meeting` types, pure time/overlap helpers, versioned `meetingStorage`, `MeetingProvider` exposing `{ state, actions, meta }`, compound `Meeting.*` UI, route-scoped provider in `App.tsx`, header nav link.

**Tech Stack:** Vite, React 19, TypeScript, Tailwind v4, react-router-dom; Vitest for pure util tests (new).

**Spec:** `docs/superpowers/specs/2026-11-18-meeting-planner-design.md`

## Global Constraints

- Do not change todo behavior, `TodoContext`, or `pattern-todos` storage.
- No new state libraries (no Redux/Zustand/React Query).
- Compound components + `{ state, actions, meta }`; React 19 `use()` for the meeting hook (match `useTodoContext`).
- Overlap predicate: `a.start < b.end && b.start < a.end` (end-to-start touch is allowed).
- Both start and end must be in the device local current calendar month; `end > start`; title non-empty after trim.
- Storage key `pattern-meetings`, schema `{ v: 1, meetings: Meeting[] }`.
- Native `datetime-local` inputs; local timezone only.
- Exact form error strings:
  - `"Enter a meeting title."`
  - `"End must be after start."`
  - `"Start and end must be in the current month."`
  - `"That time overlaps an existing meeting."`

## Review Focus

- End equals start → rejected with `"End must be after start."` (covered in Task 1 + Task 3).
- Meeting fully in next month → rejected with month error (Task 1 + Task 3).
- Existing `10:00–11:00`, new `11:00–12:00` → allowed (Task 1).
- Existing `10:00–11:00`, new `10:30–10:45` → rejected overlap (Task 1 + Task 3).
- Corrupt `pattern-meetings` JSON → load as `[]`, app still mounts (Task 2).

## File map

| File | Responsibility |
| --- | --- |
| `src/types/meeting.ts` | `Meeting` type |
| `src/utils/meetingTime.ts` | Month/range/overlap pure helpers |
| `src/utils/meetingTime.test.ts` | Vitest coverage for helpers |
| `src/utils/meetingStorage.ts` | Versioned localStorage load/save/id |
| `src/context/MeetingContext.tsx` | Provider + context value |
| `src/hooks/useMeetingContext.ts` | `use()` consumer hook |
| `src/components/meeting/Meeting.tsx` | Compound UI |
| `src/pages/MeetingPage.tsx` | Compose `Meeting.*` |
| `src/App.tsx` | `/meetings` route |
| `src/components/layout/SiteHeader.tsx` | Meetings nav link |
| `package.json` / `vite.config.ts` | Vitest script + config |
| `src/pages/AboutPage.tsx` | Optional one bullet (Task 5) |

---

### Task 1: Meeting types + time helpers (TDD)

**Files:**
- Create: `src/types/meeting.ts`
- Create: `src/utils/meetingTime.ts`
- Create: `src/utils/meetingTime.test.ts`
- Modify: `package.json` (add `vitest` devDependency + `"test": "vitest run"`)
- Modify: `vite.config.ts` (add `test: { environment: 'node' }` via vitest vite plugin, or minimal vitest config — prefer `/// <reference types="vitest/config" />` and `test` key in existing Vite config)

**Interfaces:**
- Consumes: nothing
- Produces:
  - `export type Meeting = { id: string; title: string; start: number; end: number }`
  - `isInCurrentMonth(ms: number, now?: number): boolean`
  - `isValidRange(start: number, end: number): boolean` — true iff `end > start`
  - `meetingsOverlap(a: Pick<Meeting,'start'|'end'>, b: Pick<Meeting,'start'|'end'>): boolean`
  - `hasConflict(existing: Array<Pick<Meeting,'start'|'end'>>, next: Pick<Meeting,'start'|'end'>): boolean`
  - `filterAndSortCurrentMonth(meetings: Meeting[], now?: number): Meeting[]`
  - `formatMonthLabel(now?: number): string` — e.g. `"November 2026"` via `Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })`

- [ ] **Step 1: Add Vitest**

```bash
npm install -D vitest
```

Wire `test` script and Vite `test` config so `npm test` runs Vitest.

- [ ] **Step 2: Write failing tests** in `src/utils/meetingTime.test.ts`

Use a fixed `now` of `Date.UTC(2026, 10, 15, 12, 0, 0)` (15 Nov 2026) **only where helpers accept `now`**. For local-month helpers, construct local dates with `new Date(2026, 10, …).getTime()` so tests match “device local month” semantics.

Assertions:
- `isValidRange(10, 10) === false`; `isValidRange(10, 11) === true`
- `meetingsOverlap({start:10,end:20},{start:20,end:30}) === false`
- `meetingsOverlap({start:10,end:20},{start:15,end:25}) === true`
- `hasConflict([{start:10,end:20}], {start:15,end:16}) === true`
- `isInCurrentMonth` true for a timestamp mid current local month; false for previous/next month
- `filterAndSortCurrentMonth` drops other months and sorts by `start` ascending
- `formatMonthLabel` contains the current local month name and year for the provided `now`

- [ ] **Step 3: Run tests — expect FAIL**

Run: `npm test`  
Expected: FAIL (modules/functions missing)

- [ ] **Step 4: Implement types + helpers**

Create `Meeting` type and implement the signatures in `meetingTime.ts`. `isInCurrentMonth(ms, now = Date.now())` compares local `getFullYear()` / `getMonth()`.

- [ ] **Step 5: Run tests — expect PASS**

Run: `npm test`  
Expected: PASS

- [ ] **Step 6: Commit** (only if the human asked for commits)

```bash
git add package.json package-lock.json vite.config.ts src/types/meeting.ts src/utils/meetingTime.ts src/utils/meetingTime.test.ts
git commit -m "feat(meetings): add types and overlap/month helpers"
```

---

### Task 2: Meeting storage

**Files:**
- Create: `src/utils/meetingStorage.ts`
- Create: `src/utils/meetingStorage.test.ts` (use Vitest + mock `localStorage` or a small in-memory stub if jsdom not configured — prefer testing parse/validate via exporting `parseStoredMeetings(raw: string | null): Meeting[]` and keeping `loadMeetings` as thin wrapper)

**Interfaces:**
- Consumes: `Meeting` from `src/types/meeting.ts`
- Produces:
  - `loadMeetings(): Meeting[]`
  - `saveMeetings(meetings: Meeting[]): void`
  - `createMeetingId(): string` — `crypto.randomUUID()`
  - `parseStoredMeetings(raw: string | null): Meeting[]` — returns `[]` on null/corrupt/wrong version

Mirror `src/utils/todoStorage.ts`: key `pattern-meetings`, `SCHEMA_VERSION = 1`, cached read, filter with a type guard.

- [ ] **Step 1: Write failing tests** for `parseStoredMeetings`

- `null` → `[]`
- `'not-json'` → `[]`
- `{"v":1,"meetings":[]}` → `[]`
- valid one meeting → array length 1 with same fields
- `{"v":2,"meetings":[...]}` → `[]`
- meeting missing `end` → filtered out

- [ ] **Step 2: Run `npm test` — expect FAIL**

- [ ] **Step 3: Implement `meetingStorage.ts`**

- [ ] **Step 4: Run `npm test` — expect PASS**

- [ ] **Step 5: Commit** (only if asked)

```bash
git add src/utils/meetingStorage.ts src/utils/meetingStorage.test.ts
git commit -m "feat(meetings): add versioned localStorage helpers"
```

---

### Task 3: MeetingProvider + hook

**Files:**
- Create: `src/context/MeetingContext.tsx`
- Create: `src/hooks/useMeetingContext.ts`

**Interfaces:**
- Consumes: `loadMeetings`, `saveMeetings`, `createMeetingId`, all `meetingTime` helpers
- Produces: `MeetingContext`, `MeetingProvider`, `MeetingContextValue`, `useMeetingContext()`

Exact value shape from the spec:

```ts
type MeetingContextValue = {
  state: { meetings: Meeting[]; formError: string | null }
  actions: {
    add: (input: { title: string; start: number; end: number }) => boolean
    remove: (id: string) => void
    clearFormError: () => void
  }
  meta: { visibleMeetings: Meeting[]; monthLabel: string }
}
```

`add` logic (order matters):
1. Trim title; if empty → `formError` title string, return `false`
2. If `!isValidRange(start, end)` → range error, return `false`
3. If either instant not `isInCurrentMonth` → month error, return `false`
4. If `hasConflict(meetings, { start, end })` → overlap error, return `false`
5. Else append `{ id: createMeetingId(), title: trimmed, start, end }`, clear error, return `true`

`meta.visibleMeetings = filterAndSortCurrentMonth(meetings)`; `meta.monthLabel = formatMonthLabel()`.

Persist with `useEffect` on `meetings` like todos. Lazy `useState(() => loadMeetings())`.

- [ ] **Step 1: Implement context + hook** matching `TodoContext` / `useTodoContext` style (`createContext` + React 19 `<MeetingContext value={…}>`, hook via `use()`).

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc -b --pretty false`  
Expected: exit 0 (or only pre-existing unrelated errors — none expected)

- [ ] **Step 3: Commit** (only if asked)

```bash
git add src/context/MeetingContext.tsx src/hooks/useMeetingContext.ts
git commit -m "feat(meetings): add MeetingProvider and hook"
```

---

### Task 4: Meeting compound UI + page

**Files:**
- Create: `src/components/meeting/Meeting.tsx`
- Create: `src/pages/MeetingPage.tsx`

**Interfaces:**
- Consumes: `useMeetingContext`, `Meeting` type
- Produces: `export const Meeting = { Frame, Heading, Form, List, Item, Empty }` and `MeetingPage`

**UI rules:**
- Match visual language of `Todo.tsx` (same spacing/border/accent classes).
- `Heading` shows children title plus `meta.monthLabel` as supporting text.
- `Form`: fields `title` (text), `start` / `end` (`datetime-local`). On submit, parse to epoch ms via `new Date(value).getTime()`; call `actions.add`; if `true`, `form.reset()`; if `false`, leave fields as-is. Show `state.formError` in a `role="alert"` region.
- `Item`: show title + readable local range; Delete calls `actions.remove(id)`.
- `MeetingPage` composes like `TodoPage` (list vs empty).

- [ ] **Step 1: Implement `Meeting.tsx` and `MeetingPage.tsx`**

- [ ] **Step 2: Verify build**

Run: `npm run build`  
Expected: success

- [ ] **Step 3: Commit** (only if asked)

```bash
git add src/components/meeting/Meeting.tsx src/pages/MeetingPage.tsx
git commit -m "feat(meetings): add compound Meeting UI and page"
```

---

### Task 5: Route, nav, smoke verification

**Files:**
- Modify: `src/App.tsx` — add route  
  `path="/meetings"` → `<MeetingProvider><MeetingPage /></MeetingProvider>`
- Modify: `src/components/layout/SiteHeader.tsx` — `NavLink` to `/meetings` labeled `Meetings` between Tasks and About
- Modify: `src/pages/AboutPage.tsx` — add one Composition bullet:  
  `"MeetingProvider mirrors todos: compound Meeting.* + overlap checks in utils."`

**Interfaces:**
- Consumes: `MeetingProvider`, `MeetingPage`
- Produces: working `/meetings` navigation

- [ ] **Step 1: Wire route + header (+ About bullet)**

- [ ] **Step 2: Build**

Run: `npm run build`  
Expected: success

- [ ] **Step 3: Manual smoke** (dev server)

Run: `npm run dev`  
Check:
1. Header → Meetings shows month label + empty state
2. Add valid meeting → appears sorted; refresh keeps it
3. Overlapping add → alert with overlap copy; list unchanged
4. Touching end-to-start → allowed
5. Delete removes row; `/` todos still work; `localStorage` key `pattern-meetings` present

- [ ] **Step 4: Commit** (only if asked)

```bash
git add src/App.tsx src/components/layout/SiteHeader.tsx src/pages/AboutPage.tsx
git commit -m "feat(meetings): wire /meetings route and nav"
```

---

## Spec coverage check

| Spec requirement | Task |
| --- | --- |
| Types + overlap/month rules | 1 |
| localStorage persistence | 2 |
| Provider `{ state, actions, meta }`, add/remove/errors | 3 |
| Compound list UI + form | 4 |
| `/meetings` + header (+ optional About) | 5 |
| Todos untouched | Global constraint + Task 5 smoke |
