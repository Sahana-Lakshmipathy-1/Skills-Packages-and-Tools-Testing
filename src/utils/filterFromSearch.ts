import type { TodoFilter } from '../types/todo'

export function filterFromSearch(search: string): TodoFilter {
  const value = new URLSearchParams(search).get('filter')
  if (value === 'active' || value === 'completed' || value === 'all') {
    return value
  }
  return 'all'
}

export function searchFromFilter(filter: TodoFilter): string {
  if (filter === 'all') return ''
  return `?filter=${filter}`
}
