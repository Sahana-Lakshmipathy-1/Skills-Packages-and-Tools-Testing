import { Todo } from '../components/todo/Todo'
import { useTodoContext } from '../hooks/useTodoContext'

function emptyMessage(
  filter: string,
  hasAnyTodos: boolean,
): string {
  if (!hasAnyTodos) return 'No tasks yet. Add your first one above.'
  if (filter === 'active') return 'No active tasks. You’re all caught up.'
  if (filter === 'completed') return 'No completed tasks yet.'
  return 'No tasks match this filter.'
}

export function TodoPage() {
  const { state, meta } = useTodoContext()
  const hasVisible = meta.visibleTodos.length > 0

  return (
    <Todo.Frame>
      <Todo.Heading>Capture work. Keep the URL in sync.</Todo.Heading>
      <Todo.Form />
      <Todo.Filters />
      {hasVisible ? (
        <Todo.List>
          {meta.visibleTodos.map((todo) => (
            <Todo.Item key={todo.id} todo={todo} />
          ))}
        </Todo.List>
      ) : (
        <Todo.Empty>
          {emptyMessage(state.filter, state.todos.length > 0)}
        </Todo.Empty>
      )}
      <Todo.UndoToast />
    </Todo.Frame>
  )
}
