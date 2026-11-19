import type { Meeting } from '../types/meeting'

export function isValidRange(start: number, end: number): boolean {
  return end > start
}

export function meetingsOverlap(
  a: Pick<Meeting, 'start' | 'end'>,
  b: Pick<Meeting, 'start' | 'end'>,
): boolean {
  return a.start < b.end && b.start < a.end
}

export function hasConflict(
  existing: Array<Pick<Meeting, 'start' | 'end'>>,
  next: Pick<Meeting, 'start' | 'end'>,
): boolean {
  return existing.some((meeting) => meetingsOverlap(meeting, next))
}

export function isInCurrentMonth(ms: number, now: number = Date.now()): boolean {
  const date = new Date(ms)
  const current = new Date(now)
  return (
    date.getFullYear() === current.getFullYear() &&
    date.getMonth() === current.getMonth()
  )
}

export function filterAndSortCurrentMonth(
  meetings: Meeting[],
  now: number = Date.now(),
): Meeting[] {
  return meetings
    .filter(
      (meeting) =>
        isInCurrentMonth(meeting.start, now) &&
        isInCurrentMonth(meeting.end, now),
    )
    .slice()
    .sort((a, b) => a.start - b.start || a.end - b.end)
}

export function formatMonthLabel(now: number = Date.now()): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(now))
}

export function parseMeetingFormInput(data: FormData): {
  title: string
  start: number
  end: number
} {
  return {
    title: String(data.get('title') ?? ''),
    start: new Date(String(data.get('start') ?? '')).getTime(),
    end: new Date(String(data.get('end') ?? '')).getTime(),
  }
}

export function formatMeetingRange(start: number, end: number): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const sameDay =
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate()

  const startLabel = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(start)

  const endLabel = new Intl.DateTimeFormat(
    undefined,
    sameDay
      ? { hour: 'numeric', minute: '2-digit' }
      : { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' },
  ).format(end)

  return `${startLabel} – ${endLabel}`
}
