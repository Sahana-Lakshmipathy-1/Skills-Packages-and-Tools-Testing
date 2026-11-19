import { memo, useEffect, useRef, type FormEvent, type ReactNode } from 'react'
import type { Meeting as MeetingItem } from '../../types/meeting'
import {
  useMeetingActions,
  useMeetingContext,
} from '../../hooks/useMeetingContext'
import {
  formatMeetingRange,
  parseMeetingFormInput,
} from '../../utils/meetingTime'
import {
  PatternEmpty,
  PatternFrame,
  PatternList,
} from '../pattern/PatternShell'
import { CalendarIcon, PlusIcon, TrashIcon, WarningIcon } from '../icons'

function Frame({ children }: { children: ReactNode }) {
  return <PatternFrame labelledBy="meeting-heading">{children}</PatternFrame>
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
  const { state } = useMeetingContext()
  const { add } = useMeetingActions()
  const errorRef = useRef<HTMLDivElement>(null)
  const hasError = Boolean(state.formError)

  useEffect(() => {
    if (state.formError) errorRef.current?.focus()
  }, [state.formError])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const ok = add(parseMeetingFormInput(new FormData(form)))
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
  return <PatternList label="Meeting list">{children}</PatternList>
}

const Item = memo(function Item({ meeting }: { meeting: MeetingItem }) {
  const { remove } = useMeetingActions()

  return (
    <li className="list-row ui-panel flex items-center gap-3 px-3 py-3 transition-colors duration-200 hover:border-border-strong">
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
        onClick={() => remove(meeting.id)}
        className="ui-btn-danger"
      >
        <TrashIcon size={18} />
        <span className="sr-only sm:not-sr-only">Delete</span>
      </button>
    </li>
  )
})

function Empty({ children }: { children: ReactNode }) {
  return (
    <PatternEmpty
      icon={
        <CalendarIcon
          size={28}
          className="mx-auto mb-3 text-primary opacity-70"
        />
      }
    >
      {children}
    </PatternEmpty>
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
