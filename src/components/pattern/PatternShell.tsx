import type { ReactNode } from 'react'

export function PatternFrame({
  labelledBy,
  children,
}: {
  labelledBy: string
  children: ReactNode
}) {
  return (
    <section
      aria-labelledby={labelledBy}
      className="mx-auto flex w-full max-w-xl flex-col gap-6"
    >
      {children}
    </section>
  )
}

export function PatternList({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <ul className="flex list-none flex-col gap-2 p-0" aria-label={label}>
      {children}
    </ul>
  )
}

export function PatternEmpty({
  children,
  icon,
}: {
  children: ReactNode
  icon?: ReactNode
}) {
  return (
    <div
      role="status"
      className="rounded-xl border border-dashed border-border-strong bg-bg-elevated/50 px-4 py-12 text-center text-ink-muted"
    >
      {icon}
      <p className="mx-auto max-w-sm text-base leading-relaxed">{children}</p>
    </div>
  )
}
