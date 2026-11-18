const patterns = [
  {
    skill: 'Composition Patterns',
    points: [
      'TodoProvider lifts state; UI only consumes { state, actions, meta }.',
      'Compound Todo.* pieces share context instead of boolean prop APIs.',
      'React 19 use() reads context; no forwardRef.',
      'MeetingProvider mirrors todos: compound Meeting.* + overlap checks in utils.',
    ],
  },
  {
    skill: 'React Best Practices',
    points: [
      'Lazy localStorage hydrate via useState(() => loadTodos()).',
      'Versioned storage schema { v: 1, todos } with a cached read.',
      'Filter changes use startTransition; counts are derived in render.',
    ],
  },
  {
    skill: 'Web Design Guidelines',
    points: [
      'Labeled form, focus-visible rings, aria-live undo toast.',
      'Filter lives in the URL (?filter=active) for deep links.',
      'Ellipsis in copy, tabular-nums for counts, prefers-reduced-motion.',
    ],
  },
  {
    skill: 'UI/UX Pro Max',
    points: [
      'Teal + orange CTA palette with Plus Jakarta Sans (design-system/pattern-todos).',
      'Flat productivity UI: 44px touch targets, SVG icons, cursor-pointer, 200ms transitions.',
      'Meeting errors use a focusable role=alert summary near the form.',
    ],
  },
]

export function AboutPage() {
  return (
    <article className="mx-auto flex w-full max-w-xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold tracking-wide text-primary uppercase">
          About
        </p>
        <h1 className="text-pretty text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Patterns This App Demonstrates
        </h1>
        <p className="max-w-prose text-base text-ink-muted">
          A lean Vite + React + TypeScript demo built against Vercel agent skills
          and nextlevelbuilder/ui-ux-pro-max-skill.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        {patterns.map((section) => (
          <section
            key={section.skill}
            className="ui-panel flex flex-col gap-3 p-5"
          >
            <h2 className="text-pretty text-xl font-semibold text-ink">
              {section.skill}
            </h2>
            <ul className="flex list-disc flex-col gap-2 pl-5 text-ink-muted">
              {section.points.map((point) => (
                <li key={point} className="leading-relaxed">
                  {point}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </article>
  )
}
