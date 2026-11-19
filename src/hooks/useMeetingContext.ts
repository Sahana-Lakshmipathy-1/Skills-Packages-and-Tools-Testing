import { use } from 'react'
import {
  MeetingActionsContext,
  MeetingContext,
  type MeetingActions,
  type MeetingContextValue,
} from '../context/MeetingContext'

export function useMeetingContext(): MeetingContextValue {
  const value = use(MeetingContext)
  if (!value) {
    throw new Error('useMeetingContext must be used within MeetingProvider')
  }
  return value
}

export function useMeetingActions(): MeetingActions {
  const actions = use(MeetingActionsContext)
  if (!actions) {
    throw new Error('useMeetingActions must be used within MeetingProvider')
  }
  return actions
}
