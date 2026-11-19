import type { TodoItem } from '../types/todo'
import { createVersionedStorage } from './versionedStorage'

const STORAGE_KEY = 'pattern-todos'
const SCHEMA_VERSION = 1

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

const storage = createVersionedStorage<TodoItem>({
  key: STORAGE_KEY,
  version: SCHEMA_VERSION,
  collectionKey: 'todos',
  isItem: isTodoItem,
})

export function loadTodos(): TodoItem[] {
  return storage.load()
}

export function saveTodos(todos: TodoItem[]): void {
  storage.save(todos)
}

export function createTodoId(): string {
  return crypto.randomUUID()
}
