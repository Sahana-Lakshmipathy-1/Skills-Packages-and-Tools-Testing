import type { Meeting } from '../types/meeting'
import { createVersionedStorage } from './versionedStorage'

const STORAGE_KEY = 'pattern-meetings'
const SCHEMA_VERSION = 1

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

const storage = createVersionedStorage<Meeting>({
  key: STORAGE_KEY,
  version: SCHEMA_VERSION,
  collectionKey: 'meetings',
  isItem: isMeeting,
})

export function parseStoredMeetings(raw: string | null): Meeting[] {
  return storage.parse(raw)
}

export function loadMeetings(): Meeting[] {
  return storage.load()
}

export function saveMeetings(meetings: Meeting[]): void {
  storage.save(meetings)
}

export function createMeetingId(): string {
  return crypto.randomUUID()
}
