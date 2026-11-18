export type TodoFilter = 'all' | 'active' | 'completed'

export type TodoItem = {
  id: string
  text: string
  completed: boolean
  createdAt: number
}

export type TodoCounts = {
  all: number
  active: number
  completed: number
}

export type PendingUndo = {
  item: TodoItem
  index: number
  expiresAt: number
}
