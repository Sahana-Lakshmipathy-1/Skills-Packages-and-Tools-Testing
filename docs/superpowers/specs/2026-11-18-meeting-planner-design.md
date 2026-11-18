# Simple Meeting Planner — Design

**Date:** 2026-11-18  
**Status:** Approved in conversation; awaiting final file review  
**App:** Pattern Todos (Vite + React 19 + TypeScript + Tailwind)

## Intent

Let someone schedule meetings for the **current calendar month** from a **simple list**, and never save two meetings that **overlap in time**.

## Goals

- Add a meeting with **title**, **start**, and **end**
- Show a **list** of this month’s meetings, soonest first
- **Reject** overlapping adds with a clear, visible error (form stays filled)
- **Delete** a meeting
- **Persist** meetings across reloads (localStorage)

## Non-goals

- Browsing or planning other months
- Calendar grid / week view
- Editing an existing meeting
- Attendees, location, rooms, reminders
- Timezone picker (use the device’s local timezone)

## Anti-goals

- Silently saving an overlapping meeting
- Mixing meeting state into the todo model/context

## Constraints

- Same stack as the existing app: Vite, React 19, TypeScript, Tailwind v4, `react-router-dom`
- Match the demo’s architecture lessons: compound components, lifted provider state, `{ state, actions, meta }` context, versioned localStorage, lean pure utils
- Stay lean — no new state libraries

## Approaches considered

| Approach | Summary | Trade-off |
| --- | --- | --- |
| **1. Mirror todo architecture** | New `/meetings` route, `MeetingProvider`, compound `Meeting.*`, own storage + overlap utils | More files; clearest teaching parallel |
| **2. Page-local state** | One page with `useState` and inline UI | Fastest, but skips composition patterns this repo exists to show |
| **3. Fold into todos** | Extend todo types/context with meeting fields | One store, but couples two domains and muddies the demo |

**Chosen:** Approach 1 (user-approved).

## Product behavior

### Scope of “current month”

- “Current month” means the device’s **local** calendar month at runtime.
- Both **start** and **end** must fall within that month (same year-month).
- `end` must be **strictly after** `start`.
- Title must be non-empty after trim.

### Conflict rule

- Two meetings conflict when their half-open or closed time ranges **overlap in time** (any shared instant counts as overlap; touching end-to-start with no shared instant is allowed — builder may use standard interval overlap: `a.start < b.end && b.start < a.end`).
- On conflict, do **not** mutate the list; set an error message the form surfaces.

### List

- Only meetings in the current month (storage may hold only current-month data for v1; filtering by month is still required in meta).
- Sorted ascending by `start`, then by `end` if needed.
- Empty state when there are none.

### Persistence

- Separate localStorage key from todos (e.g. `pattern-meetings`).
- Versioned payload shape mirroring `todoStorage` (`{ v, meetings }`).
- Lazy initial read; write on change.

## Architecture

```
BrowserRouter
└─ AppShell
   ├─ /           → TodoProvider → TodoPage
   ├─ /meetings   → MeetingProvider → MeetingPage → Meeting.*
   └─ /about      → AboutPage (optional one-line mention)
```

### Types (`src/types/meeting.ts`)

```ts
type Meeting = {
  id: string
  title: string
  start: number // epoch ms
  end: number   // epoch ms
}
```

### Context (`src/context/MeetingContext.tsx`)

```ts
type MeetingContextValue = {
  state: {
    meetings: Meeting[]
    formError: string | null
  }
  actions: {
    add: (input: { title: string; start: number; end: number }) => boolean
    remove: (id: string) => void
    clearFormError: () => void
  }
  meta: {
    visibleMeetings: Meeting[] // current month, sorted
    monthLabel: string         // e.g. "November 2026"
  }
}
```

- `add` returns `false` when validation or overlap fails (and sets `formError`); `true` on success (clears error).
- No undo for delete in v1 (todos keep undo; meetings stay simpler).

### Utils

- `src/utils/meetingStorage.ts` — load/save/createId (same patterns as `todoStorage`)
- `src/utils/meetingTime.ts` — `isInCurrentMonth`, `isValidRange`, `meetingsOverlap`, `hasConflict`

### UI (`src/components/meeting/Meeting.tsx`)

Compound export:

- `Meeting.Frame`
- `Meeting.Heading` (includes month label)
- `Meeting.Form` (title + start + end; shows `formError`)
- `Meeting.List` / `Meeting.Item` / `Meeting.Empty`

Page (`src/pages/MeetingPage.tsx`) only composes these pieces.

### Routing / chrome

- Register `/meetings` in `App.tsx` with `MeetingProvider` scoped to that route.
- Add **Meetings** `NavLink` in `SiteHeader`.

## What’s left to the builder

- Exact labels, placeholders, and error copy
- Native `datetime-local` vs separate date/time inputs (prefer native `datetime-local` unless blocked)
- Whether `/about` gets a short bullet (nice-to-have, not required for done)
- Unit-testability of pure overlap/month helpers (prefer small pure tests if a test runner is added; otherwise verify manually — this repo currently has no test script)

## Success criteria

1. From the header, open Meetings and see this month’s label and list (or empty state).
2. Adding a valid non-overlapping meeting appends it to the sorted list and survives refresh.
3. Adding a meeting that overlaps an existing one shows an error and does not change the list.
4. Deleting a meeting removes it from the list and storage.
5. Todos route and storage remain unchanged in behavior.
