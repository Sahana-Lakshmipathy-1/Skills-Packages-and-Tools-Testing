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
import { filterFromSearch, searchFromFilter } from '../utils/filterFromSearch'
import { createTodoId, loadTodos, saveTodos } from '../utils/todoStorage'

const UNDO_MS = 5000

type TodoState = {
  todos: TodoItem[]
  filter: TodoFilter
  pendingUndo: PendingUndo | null
}

type TodoActions = {
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

export type TodoContextValue = {
  state: TodoState
  actions: TodoActions
  meta: TodoMeta
}

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
    saveTodos(todos)
  }, [todos])

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
        const search = searchFromFilter(next)
        setSearchParams(search ? { filter: next } : {}, { replace: true })
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

  const counts = useMemo(() => deriveCounts(todos), [todos])
  const visibleTodos = useMemo(
    () => filterTodos(todos, filter),
    [todos, filter],
  )

  const value = useMemo<TodoContextValue>(
    () => ({
      state: { todos, filter, pendingUndo },
      actions: { add, toggle, remove, setFilter, undoRemove, dismissUndo },
      meta: { counts, visibleTodos },
    }),
    [
      todos,
      filter,
      pendingUndo,
      add,
      toggle,
      remove,
      setFilter,
      undoRemove,
      dismissUndo,
      counts,
      visibleTodos,
    ],
  )

  return <TodoContext value={value}>{children}</TodoContext>
}
