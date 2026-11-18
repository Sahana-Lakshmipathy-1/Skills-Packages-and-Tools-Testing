import { use } from 'react'
import { TodoContext, type TodoContextValue } from '../context/TodoContext'

export function useTodoContext(): TodoContextValue {
  const value = use(TodoContext)
  if (!value) {
    throw new Error('useTodoContext must be used within TodoProvider')
  }
  return value
}
