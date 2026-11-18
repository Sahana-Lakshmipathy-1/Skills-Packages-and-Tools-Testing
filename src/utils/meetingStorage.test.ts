import { describe, expect, it } from 'vitest'
import { parseStoredMeetings } from './meetingStorage'

describe('parseStoredMeetings', () => {
  it('returns [] for null', () => {
    expect(parseStoredMeetings(null)).toEqual([])
  })

  it('returns [] for invalid JSON', () => {
    expect(parseStoredMeetings('not-json')).toEqual([])
  })

  it('returns [] for empty valid payload', () => {
    expect(parseStoredMeetings(JSON.stringify({ v: 1, meetings: [] }))).toEqual(
      [],
    )
  })

  it('returns a valid meeting', () => {
    const meeting = {
      id: 'm1',
      title: 'Standup',
      start: 1000,
      end: 2000,
    }
    expect(
      parseStoredMeetings(JSON.stringify({ v: 1, meetings: [meeting] })),
    ).toEqual([meeting])
  })

  it('returns [] for wrong schema version', () => {
    expect(
      parseStoredMeetings(
        JSON.stringify({
          v: 2,
          meetings: [{ id: 'm1', title: 'X', start: 1, end: 2 }],
        }),
      ),
    ).toEqual([])
  })

  it('filters meetings missing end', () => {
    expect(
      parseStoredMeetings(
        JSON.stringify({
          v: 1,
          meetings: [{ id: 'm1', title: 'Broken', start: 1 }],
        }),
      ),
    ).toEqual([])
  })
})
