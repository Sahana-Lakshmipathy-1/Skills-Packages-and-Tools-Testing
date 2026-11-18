import type { TodoItem } from '../types/todo'

const STORAGE_KEY = 'pattern-todos'
const SCHEMA_VERSION = 1

type StoredTodos = {
  v: typeof SCHEMA_VERSION
  todos: TodoItem[]
}

let cachedRead: TodoItem[] | null = null

function isTodoItem(value: unknown): value is TodoItem {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    typeof item.text === 'string' &&
    typeof item.completed === 'boolean' &&
    typeof item.createdAt === 'number'
  )
}

export function loadTodos(): TodoItem[] {
  if (cachedRead) return cachedRead

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      cachedRead = []
      return cachedRead
    }

    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      (parsed as StoredTodos).v === SCHEMA_VERSION &&
      Array.isArray((parsed as StoredTodos).todos)
    ) {
      const todos = (parsed as StoredTodos).todos.filter(isTodoItem)
      cachedRead = todos
      return todos
    }
  } catch {
    // Ignore corrupt storage and start fresh.
  }

  cachedRead = []
  return cachedRead
}

export function saveTodos(todos: TodoItem[]): void {
  const payload: StoredTodos = { v: SCHEMA_VERSION, todos }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  cachedRead = todos
}

export function createTodoId(): string {
  return crypto.randomUUID()
}
