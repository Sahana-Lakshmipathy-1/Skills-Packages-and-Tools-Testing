import { use } from 'react'
import {
  TodoActionsContext,
  TodoContext,
  type TodoActions,
  type TodoContextValue,
} from '../context/TodoContext'

export function useTodoContext(): TodoContextValue {
  const value = use(TodoContext)
  if (!value) {
    throw new Error('useTodoContext must be used within TodoProvider')
  }
  return value
}

export function useTodoActions(): TodoActions {
  const actions = use(TodoActionsContext)
  if (!actions) {
    throw new Error('useTodoActions must be used within TodoProvider')
  }
  return actions
}
