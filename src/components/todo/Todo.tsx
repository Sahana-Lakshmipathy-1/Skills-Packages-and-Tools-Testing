import type { FormEvent, ReactNode } from 'react'
import type { TodoFilter, TodoItem } from '../../types/todo'
import { useTodoContext } from '../../hooks/useTodoContext'
import { PlusIcon, TrashIcon } from '../icons'

function Frame({ children }: { children: ReactNode }) {
  return (
    <section
      aria-labelledby="todo-heading"
      className="mx-auto flex w-full max-w-xl flex-col gap-6"
    >
      {children}
    </section>
  )
}

function Heading({ children }: { children: ReactNode }) {
  return (
    <header className="flex flex-col gap-2">
      <p className="text-sm font-semibold tracking-wide text-primary uppercase">
        Pattern Todos
      </p>
      <h1
        id="todo-heading"
        className="text-pretty text-3xl font-bold tracking-tight text-ink sm:text-4xl"
      >
        {children}
      </h1>
      <p className="max-w-prose text-base text-ink-muted">
        Capture work, filter in the URL, and undo deletes without ceremony.
      </p>
    </header>
  )
}

function Form() {
  const { actions } = useTodoContext()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const text = String(data.get('todo') ?? '')
    actions.add(text)
    form.reset()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="ui-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:gap-3"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <label htmlFor="todo-input" className="ui-label">
          New Task
        </label>
        <input
          id="todo-input"
          name="todo"
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="Buy oat milk…"
          className="ui-input"
        />
      </div>
      <button type="submit" className="ui-btn-cta sm:shrink-0">
        <PlusIcon size={18} />
        Add Task
      </button>
    </form>
  )
}

const FILTERS: { id: TodoFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
]

function Filters() {
  const { state, actions, meta } = useTodoContext()

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div
        role="group"
        aria-label="Filter tasks"
        className="flex flex-wrap gap-1 rounded-xl border border-border bg-bg-elevated/90 p-1 shadow-soft"
      >
        {FILTERS.map((filter) => {
          const selected = state.filter === filter.id
          const count = meta.counts[filter.id]
          return (
            <button
              key={filter.id}
              type="button"
              aria-pressed={selected}
              onClick={() => actions.setFilter(filter.id)}
              className={[
                'inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
                selected
                  ? 'bg-primary-soft text-primary'
                  : 'text-ink-muted hover:bg-primary-soft/60 hover:text-ink',
              ].join(' ')}
            >
              {filter.label}
              <span
                className={[
                  'inline-flex min-w-6 justify-center rounded-md px-1.5 py-0.5 text-xs tabular-nums',
                  selected ? 'bg-bg-elevated text-primary' : 'bg-primary-soft/50',
                ].join(' ')}
                aria-hidden="true"
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>
      <p className="text-sm text-ink-muted">
        <span className="font-semibold text-ink tabular-nums">
          {meta.counts.active}
        </span>{' '}
        left
      </p>
    </div>
  )
}

function List({ children }: { children: ReactNode }) {
  return (
    <ul className="flex list-none flex-col gap-2 p-0" aria-label="Task list">
      {children}
    </ul>
  )
}

function Item({ todo }: { todo: TodoItem }) {
  const { actions } = useTodoContext()
  const checkboxId = `todo-${todo.id}`

  return (
    <li
      className="ui-panel flex items-center gap-3 px-3 py-2 transition-colors duration-200 hover:border-border-strong"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 56px' }}
    >
      <input
        id={checkboxId}
        type="checkbox"
        checked={todo.completed}
        onChange={() => actions.toggle(todo.id)}
        className="size-5 shrink-0 cursor-pointer accent-primary"
      />
      <label
        htmlFor={checkboxId}
        className={[
          'min-w-0 flex-1 cursor-pointer break-words py-2 text-base leading-snug',
          todo.completed ? 'text-ink-muted line-through' : 'text-ink',
        ].join(' ')}
      >
        {todo.text}
      </label>
      <button
        type="button"
        aria-label={`Delete “${todo.text}”`}
        onClick={() => actions.remove(todo.id)}
        className="ui-btn-danger"
      >
        <TrashIcon size={18} />
        <span className="sr-only sm:not-sr-only">Delete</span>
      </button>
    </li>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="rounded-xl border border-dashed border-border-strong bg-bg-elevated/50 px-4 py-12 text-center text-ink-muted"
    >
      <p className="mx-auto max-w-sm text-base leading-relaxed">{children}</p>
    </div>
  )
}

function UndoToast() {
  const { state, actions } = useTodoContext()
  if (!state.pendingUndo) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-[min(100%-2rem,28rem)] items-center justify-between gap-3 rounded-xl border border-border bg-bg-elevated px-4 py-3 shadow-panel"
    >
      <p className="min-w-0 truncate text-sm text-ink">
        Deleted “{state.pendingUndo.item.text}”
      </p>
      <div className="flex shrink-0 gap-2">
        <button type="button" onClick={actions.undoRemove} className="ui-btn-cta !min-h-10 !px-3 !py-2">
          Undo
        </button>
        <button
          type="button"
          onClick={actions.dismissUndo}
          aria-label="Dismiss undo"
          className="ui-btn-ghost !min-h-10 !px-3 !py-2 text-ink-muted"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

export const Todo = {
  Frame,
  Heading,
  Form,
  Filters,
  List,
  Item,
  Empty,
  UndoToast,
}
