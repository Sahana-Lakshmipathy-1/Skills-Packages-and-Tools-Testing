import { use } from 'react'
import {
  MeetingContext,
  type MeetingContextValue,
} from '../context/MeetingContext'

export function useMeetingContext(): MeetingContextValue {
  const value = use(MeetingContext)
  if (!value) {
    throw new Error('useMeetingContext must be used within MeetingProvider')
  }
  return value
}
