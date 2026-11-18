import type { Meeting } from '../types/meeting'

const STORAGE_KEY = 'pattern-meetings'
const SCHEMA_VERSION = 1

type StoredMeetings = {
  v: typeof SCHEMA_VERSION
  meetings: Meeting[]
}

let cachedRead: Meeting[] | null = null

function isMeeting(value: unknown): value is Meeting {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    typeof item.title === 'string' &&
    typeof item.start === 'number' &&
    typeof item.end === 'number'
  )
}

export function parseStoredMeetings(raw: string | null): Meeting[] {
  if (!raw) return []

  try {
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      (parsed as StoredMeetings).v === SCHEMA_VERSION &&
      Array.isArray((parsed as StoredMeetings).meetings)
    ) {
      return (parsed as StoredMeetings).meetings.filter(isMeeting)
    }
  } catch {
    // Ignore corrupt storage and start fresh.
  }

  return []
}

export function loadMeetings(): Meeting[] {
  if (cachedRead) return cachedRead

  const meetings = parseStoredMeetings(localStorage.getItem(STORAGE_KEY))
  cachedRead = meetings
  return meetings
}

export function saveMeetings(meetings: Meeting[]): void {
  const payload: StoredMeetings = { v: SCHEMA_VERSION, meetings }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  cachedRead = meetings
}

export function createMeetingId(): string {
  return crypto.randomUUID()
}
