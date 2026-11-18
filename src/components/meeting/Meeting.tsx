import { useEffect, useRef, type FormEvent, type ReactNode } from 'react'
import type { Meeting as MeetingItem } from '../../types/meeting'
import { useMeetingContext } from '../../hooks/useMeetingContext'
import { formatMeetingRange } from '../../utils/meetingTime'
import { CalendarIcon, PlusIcon, TrashIcon, WarningIcon } from '../icons'

function Frame({ children }: { children: ReactNode }) {
  return (
    <section
      aria-labelledby="meeting-heading"
      className="mx-auto flex w-full max-w-xl flex-col gap-6"
    >
      {children}
    </section>
  )
}

function Heading({ children }: { children: ReactNode }) {
  const { meta } = useMeetingContext()

  return (
    <header className="flex flex-col gap-2">
      <p className="inline-flex items-center gap-1.5 text-sm font-semibold tracking-wide text-primary uppercase">
        <CalendarIcon size={16} />
        Meeting Planner
      </p>
      <h1
        id="meeting-heading"
        className="text-pretty text-3xl font-bold tracking-tight text-ink sm:text-4xl"
      >
        {children}
      </h1>
      <p className="text-base text-ink-muted">
        Scheduling for{' '}
        <span className="font-semibold text-ink">{meta.monthLabel}</span>.
        Overlaps are blocked.
      </p>
    </header>
  )
}

function Form() {
  const { state, actions } = useMeetingContext()
  const errorRef = useRef<HTMLDivElement>(null)
  const hasError = Boolean(state.formError)

  useEffect(() => {
    if (state.formError) errorRef.current?.focus()
  }, [state.formError])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const title = String(data.get('title') ?? '')
    const startRaw = String(data.get('start') ?? '')
    const endRaw = String(data.get('end') ?? '')
    const start = new Date(startRaw).getTime()
    const end = new Date(endRaw).getTime()

    const ok = actions.add({ title, start, end })
    if (ok) form.reset()
  }

  return (
    <form onSubmit={handleSubmit} className="ui-panel flex flex-col gap-4 p-4" noValidate>
      {hasError ? (
        <div
          ref={errorRef}
          role="alert"
          tabIndex={-1}
          className="flex gap-3 rounded-lg border border-danger/40 bg-danger-soft px-3 py-3 text-danger outline-none"
        >
          <WarningIcon size={20} className="mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p id="meeting-error-title" className="text-sm font-semibold">
              Couldn’t add that meeting
            </p>
            <p className="mt-0.5 text-sm">{state.formError}</p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="meeting-title" className="ui-label">
          Title
        </label>
        <input
          id="meeting-title"
          name="title"
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="Team sync…"
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? 'meeting-error-title' : undefined}
          className="ui-input"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="meeting-start" className="ui-label">
            Start
          </label>
          <input
            id="meeting-start"
            name="start"
            type="datetime-local"
            required
            aria-invalid={hasError || undefined}
            className="ui-input"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="meeting-end" className="ui-label">
            End
          </label>
          <input
            id="meeting-end"
            name="end"
            type="datetime-local"
            required
            aria-invalid={hasError || undefined}
            className="ui-input"
          />
        </div>
      </div>
      <button type="submit" className="ui-btn-cta sm:self-start">
        <PlusIcon size={18} />
        Add Meeting
      </button>
    </form>
  )
}

function List({ children }: { children: ReactNode }) {
  return (
    <ul className="flex list-none flex-col gap-2 p-0" aria-label="Meeting list">
      {children}
    </ul>
  )
}

function Item({ meeting }: { meeting: MeetingItem }) {
  const { actions } = useMeetingContext()

  return (
    <li className="ui-panel flex items-center gap-3 px-3 py-3 transition-colors duration-200 hover:border-border-strong">
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary"
        aria-hidden="true"
      >
        <CalendarIcon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="break-words text-base font-medium text-ink">{meeting.title}</p>
        <p className="text-sm text-ink-muted tabular-nums">
          {formatMeetingRange(meeting.start, meeting.end)}
        </p>
      </div>
      <button
        type="button"
        aria-label={`Delete “${meeting.title}”`}
        onClick={() => actions.remove(meeting.id)}
        className="ui-btn-danger"
      >
        <TrashIcon size={18} />
        <span className="sr-only sm:not-sr-only">Delete</span>
      </button>
    </li>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="rounded-xl border border-dashed border-border-strong bg-bg-elevated/50 px-4 py-12 text-center text-ink-muted"
    >
      <CalendarIcon size={28} className="mx-auto mb-3 text-primary opacity-70" />
      <p className="mx-auto max-w-sm text-base leading-relaxed">{children}</p>
    </div>
  )
}

export const Meeting = {
  Frame,
  Heading,
  Form,
  List,
  Item,
  Empty,
}
