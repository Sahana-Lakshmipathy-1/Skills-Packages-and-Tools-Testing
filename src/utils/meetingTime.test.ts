import { describe, expect, it } from 'vitest'
import {
  filterAndSortCurrentMonth,
  formatMeetingRange,
  formatMonthLabel,
  hasConflict,
  isInCurrentMonth,
  isValidRange,
  meetingsOverlap,
} from './meetingTime'
import type { Meeting } from '../types/meeting'

describe('isValidRange', () => {
  it('rejects equal start and end', () => {
    expect(isValidRange(10, 10)).toBe(false)
  })

  it('accepts end after start', () => {
    expect(isValidRange(10, 11)).toBe(true)
  })
})

describe('meetingsOverlap / hasConflict', () => {
  it('allows end-to-start touch', () => {
    expect(
      meetingsOverlap({ start: 10, end: 20 }, { start: 20, end: 30 }),
    ).toBe(false)
  })

  it('detects overlapping ranges', () => {
    expect(
      meetingsOverlap({ start: 10, end: 20 }, { start: 15, end: 25 }),
    ).toBe(true)
  })

  it('hasConflict finds an overlapping candidate', () => {
    expect(hasConflict([{ start: 10, end: 20 }], { start: 15, end: 16 })).toBe(
      true,
    )
  })
})

describe('current month helpers', () => {
  const now = new Date(2026, 10, 15, 12, 0, 0).getTime()

  it('isInCurrentMonth for mid-month local timestamp', () => {
    expect(isInCurrentMonth(new Date(2026, 10, 10, 9, 0, 0).getTime(), now)).toBe(
      true,
    )
  })

  it('rejects previous and next month', () => {
    expect(isInCurrentMonth(new Date(2026, 9, 31, 12, 0, 0).getTime(), now)).toBe(
      false,
    )
    expect(isInCurrentMonth(new Date(2026, 11, 1, 0, 0, 0).getTime(), now)).toBe(
      false,
    )
  })

  it('filterAndSortCurrentMonth drops other months and sorts by start', () => {
    const meetings: Meeting[] = [
      {
        id: 'b',
        title: 'Later',
        start: new Date(2026, 10, 20, 14, 0, 0).getTime(),
        end: new Date(2026, 10, 20, 15, 0, 0).getTime(),
      },
      {
        id: 'a',
        title: 'Earlier',
        start: new Date(2026, 10, 5, 10, 0, 0).getTime(),
        end: new Date(2026, 10, 5, 11, 0, 0).getTime(),
      },
      {
        id: 'x',
        title: 'Other month',
        start: new Date(2026, 9, 5, 10, 0, 0).getTime(),
        end: new Date(2026, 9, 5, 11, 0, 0).getTime(),
      },
    ]

    const visible = filterAndSortCurrentMonth(meetings, now)
    expect(visible.map((m) => m.id)).toEqual(['a', 'b'])
  })

  it('formatMonthLabel includes month name and year', () => {
    const label = formatMonthLabel(now)
    expect(label).toContain('November')
    expect(label).toContain('2026')
  })
})

describe('formatMeetingRange', () => {
  it('includes end date when end is on a different day', () => {
    const start = new Date(2026, 10, 5, 10, 0, 0).getTime()
    const end = new Date(2026, 10, 7, 11, 0, 0).getTime()
    const label = formatMeetingRange(start, end)
    expect(label).toMatch(/Nov/)
    expect(label).toMatch(/5/)
    expect(label).toMatch(/7/)
  })
})
