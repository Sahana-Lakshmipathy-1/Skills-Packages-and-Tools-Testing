import {
  createContext,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useSearchParams } from 'react-router-dom'
import type {
  PendingUndo,
  TodoCounts,
  TodoFilter,
  TodoItem,
} from '../types/todo'
import { filterFromSearch } from '../utils/filterFromSearch'
import { schedulePersist } from '../utils/persistDebounce'
import { createTodoId, loadTodos, saveTodos } from '../utils/todoStorage'

const UNDO_MS = 5000

type TodoState = {
  todos: TodoItem[]
  filter: TodoFilter
  pendingUndo: PendingUndo | null
}

export type TodoActions = {
  add: (text: string) => void
  toggle: (id: string) => void
  remove: (id: string) => void
  setFilter: (filter: TodoFilter) => void
  undoRemove: () => void
  dismissUndo: () => void
}

type TodoMeta = {
  counts: TodoCounts
  visibleTodos: TodoItem[]
}

export type TodoDataValue = {
  state: TodoState
  meta: TodoMeta
}

export type TodoContextValue = TodoDataValue & {
  actions: TodoActions
}

export const TodoDataContext = createContext<TodoDataValue | null>(null)
export const TodoActionsContext = createContext<TodoActions | null>(null)
/** Combined context for callers that need state + actions together. */
export const TodoContext = createContext<TodoContextValue | null>(null)

function deriveCounts(todos: TodoItem[]): TodoCounts {
  let active = 0
  let completed = 0
  for (const todo of todos) {
    if (todo.completed) completed += 1
    else active += 1
  }
  return { all: todos.length, active, completed }
}

function filterTodos(todos: TodoItem[], filter: TodoFilter): TodoItem[] {
  if (filter === 'active') return todos.filter((todo) => !todo.completed)
  if (filter === 'completed') return todos.filter((todo) => todo.completed)
  return todos
}

export function TodoProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [todos, setTodos] = useState<TodoItem[]>(() => loadTodos())
  const [pendingUndo, setPendingUndo] = useState<PendingUndo | null>(null)
  const todosRef = useRef(todos)

  const filter = filterFromSearch(searchParams.toString())

  useEffect(() => {
    todosRef.current = todos
  }, [todos])

  useEffect(
    () => schedulePersist(() => saveTodos(todosRef.current)),
    [todos],
  )

  useEffect(
    () => () => {
      saveTodos(todosRef.current)
    },
    [],
  )

  useEffect(() => {
    if (!pendingUndo) return

    const remaining = Math.max(pendingUndo.expiresAt - Date.now(), 0)
    const timer = window.setTimeout(() => {
      setPendingUndo(null)
    }, remaining)

    return () => window.clearTimeout(timer)
  }, [pendingUndo])

  const add = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    setTodos((current) => [
      {
        id: createTodoId(),
        text: trimmed,
        completed: false,
        createdAt: Date.now(),
      },
      ...current,
    ])
  }, [])

  const toggle = useCallback((id: string) => {
    setTodos((current) =>
      current.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    )
  }, [])

  const remove = useCallback((id: string) => {
    const current = todosRef.current
    const index = current.findIndex((todo) => todo.id === id)
    if (index === -1) return

    const item = current[index]
    setPendingUndo({
      item,
      index,
      expiresAt: Date.now() + UNDO_MS,
    })
    setTodos((todosNow) => todosNow.filter((todo) => todo.id !== id))
  }, [])

  const setFilter = useCallback(
    (next: TodoFilter) => {
      startTransition(() => {
        if (next === 'all') {
          setSearchParams({}, { replace: true })
          return
        }
        setSearchParams({ filter: next }, { replace: true })
      })
    },
    [setSearchParams],
  )

  const undoRemove = useCallback(() => {
    setPendingUndo((current) => {
      if (!current) return null

      setTodos((todosNow) => {
        const next = [...todosNow]
        const insertAt = Math.min(current.index, next.length)
        next.splice(insertAt, 0, current.item)
        return next
      })

      return null
    })
  }, [])

  const dismissUndo = useCallback(() => {
    setPendingUndo(null)
  }, [])

  const actions = useMemo<TodoActions>(
    () => ({ add, toggle, remove, setFilter, undoRemove, dismissUndo }),
    [add, toggle, remove, setFilter, undoRemove, dismissUndo],
  )

  const counts = useMemo(() => deriveCounts(todos), [todos])
  const visibleTodos = useMemo(
    () => filterTodos(todos, filter),
    [todos, filter],
  )

  const data = useMemo<TodoDataValue>(
    () => ({
      state: { todos, filter, pendingUndo },
      meta: { counts, visibleTodos },
    }),
    [todos, filter, pendingUndo, counts, visibleTodos],
  )

  const value = useMemo<TodoContextValue>(
    () => ({ ...data, actions }),
    [data, actions],
  )

  return (
    <TodoActionsContext value={actions}>
      <TodoDataContext value={data}>
        <TodoContext value={value}>{children}</TodoContext>
      </TodoDataContext>
    </TodoActionsContext>
  )
}
