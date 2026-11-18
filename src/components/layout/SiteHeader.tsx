import { NavLink } from 'react-router-dom'
import { CalendarIcon, InfoIcon, ListChecksIcon } from '../icons'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
    isActive
      ? 'bg-primary-soft text-primary'
      : 'text-ink-muted hover:bg-primary-soft/60 hover:text-ink',
  ].join(' ')

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg-elevated/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        <NavLink
          to="/"
          className="text-base font-bold tracking-tight text-ink no-underline transition-colors duration-200 hover:text-primary"
        >
          Pattern Todos
        </NavLink>
        <nav aria-label="Primary" className="flex items-center gap-1">
          <NavLink to="/" end className={linkClass}>
            <ListChecksIcon size={18} />
            Tasks
          </NavLink>
          <NavLink to="/meetings" className={linkClass}>
            <CalendarIcon size={18} />
            Meetings
          </NavLink>
          <NavLink to="/about" className={linkClass}>
            <InfoIcon size={18} />
            About
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
