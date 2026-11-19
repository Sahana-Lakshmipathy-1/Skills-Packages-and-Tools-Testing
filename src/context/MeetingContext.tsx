import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Meeting } from '../types/meeting'
import {
  createMeetingId,
  loadMeetings,
  saveMeetings,
} from '../utils/meetingStorage'
import { schedulePersist } from '../utils/persistDebounce'
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

export type MeetingActions = {
  add: (input: { title: string; start: number; end: number }) => boolean
  remove: (id: string) => void
}

type MeetingMeta = {
  visibleMeetings: Meeting[]
  monthLabel: string
}

export type MeetingDataValue = {
  state: MeetingState
  meta: MeetingMeta
}

export type MeetingContextValue = MeetingDataValue & {
  actions: MeetingActions
}

export const MeetingDataContext = createContext<MeetingDataValue | null>(null)
export const MeetingActionsContext = createContext<MeetingActions | null>(null)
export const MeetingContext = createContext<MeetingContextValue | null>(null)

export function MeetingProvider({ children }: { children: ReactNode }) {
  const [meetings, setMeetings] = useState<Meeting[]>(() => loadMeetings())
  const [formError, setFormError] = useState<string | null>(null)
  const meetingsRef = useRef(meetings)

  useEffect(() => {
    meetingsRef.current = meetings
  }, [meetings])

  useEffect(
    () => schedulePersist(() => saveMeetings(meetingsRef.current)),
    [meetings],
  )

  useEffect(
    () => () => {
      saveMeetings(meetingsRef.current)
    },
    [],
  )

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
      if (
        hasConflict(meetingsRef.current, {
          start: input.start,
          end: input.end,
        })
      ) {
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
    [],
  )

  const remove = useCallback((id: string) => {
    setMeetings((current) => current.filter((meeting) => meeting.id !== id))
  }, [])

  const actions = useMemo<MeetingActions>(
    () => ({ add, remove }),
    [add, remove],
  )

  const visibleMeetings = useMemo(
    () => filterAndSortCurrentMonth(meetings),
    [meetings],
  )
  const monthLabel = formatMonthLabel()

  const data = useMemo<MeetingDataValue>(
    () => ({
      state: { meetings, formError },
      meta: { visibleMeetings, monthLabel },
    }),
    [meetings, formError, visibleMeetings, monthLabel],
  )

  const value = useMemo<MeetingContextValue>(
    () => ({ ...data, actions }),
    [data, actions],
  )

  return (
    <MeetingActionsContext value={actions}>
      <MeetingDataContext value={data}>
        <MeetingContext value={value}>{children}</MeetingContext>
      </MeetingDataContext>
    </MeetingActionsContext>
  )
}
