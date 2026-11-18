import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Meeting } from '../types/meeting'
import {
  createMeetingId,
  loadMeetings,
  saveMeetings,
} from '../utils/meetingStorage'
import {
  filterAndSortCurrentMonth,
  formatMonthLabel,
  hasConflict,
  isInCurrentMonth,
  isValidRange,
} from '../utils/meetingTime'

type MeetingState = {
  meetings: Meeting[]
  formError: string | null
}

type MeetingActions = {
  add: (input: { title: string; start: number; end: number }) => boolean
  remove: (id: string) => void
  clearFormError: () => void
}

type MeetingMeta = {
  visibleMeetings: Meeting[]
  monthLabel: string
}

export type MeetingContextValue = {
  state: MeetingState
  actions: MeetingActions
  meta: MeetingMeta
}

export const MeetingContext = createContext<MeetingContextValue | null>(null)

export function MeetingProvider({ children }: { children: ReactNode }) {
  const [meetings, setMeetings] = useState<Meeting[]>(() => loadMeetings())
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    saveMeetings(meetings)
  }, [meetings])

  const add = useCallback(
    (input: { title: string; start: number; end: number }) => {
      const trimmed = input.title.trim()
      if (!trimmed) {
        setFormError('Enter a meeting title.')
        return false
      }
      if (!isValidRange(input.start, input.end)) {
        setFormError('End must be after start.')
        return false
      }
      if (
        !isInCurrentMonth(input.start) ||
        !isInCurrentMonth(input.end)
      ) {
        setFormError('Start and end must be in the current month.')
        return false
      }
      if (hasConflict(meetings, { start: input.start, end: input.end })) {
        setFormError('That time overlaps an existing meeting.')
        return false
      }

      setMeetings((current) => [
        ...current,
        {
          id: createMeetingId(),
          title: trimmed,
          start: input.start,
          end: input.end,
        },
      ])
      setFormError(null)
      return true
    },
    [meetings],
  )

  const remove = useCallback((id: string) => {
    setMeetings((current) => current.filter((meeting) => meeting.id !== id))
  }, [])

  const clearFormError = useCallback(() => {
    setFormError(null)
  }, [])

  const visibleMeetings = useMemo(
    () => filterAndSortCurrentMonth(meetings),
    [meetings],
  )
  const monthLabel = useMemo(() => formatMonthLabel(), [])

  const value = useMemo<MeetingContextValue>(
    () => ({
      state: { meetings, formError },
      actions: { add, remove, clearFormError },
      meta: { visibleMeetings, monthLabel },
    }),
    [
      meetings,
      formError,
      add,
      remove,
      clearFormError,
      visibleMeetings,
      monthLabel,
    ],
  )

  return <MeetingContext value={value}>{children}</MeetingContext>
}
