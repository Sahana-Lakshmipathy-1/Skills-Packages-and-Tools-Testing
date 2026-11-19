const highlights = [
  {
    title: 'Tasks',
    body: 'Add work, filter via the URL, and undo a delete for a few seconds.',
  },
  {
    title: 'Meetings',
    body: 'Schedule in the current month. Overlapping ranges are rejected.',
  },
  {
    title: 'Local-first',
    body: 'Data stays in this browser with a versioned storage schema.',
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
          Pattern Todos
        </h1>
        <p className="max-w-prose text-base text-ink-muted">
          A small Vite + React app for capturing tasks and planning meetings
          without a backend.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        {highlights.map((section) => (
          <section
            key={section.title}
            className="ui-panel flex flex-col gap-2 p-5"
          >
            <h2 className="text-pretty text-xl font-semibold text-ink">
              {section.title}
            </h2>
            <p className="leading-relaxed text-ink-muted">{section.body}</p>
          </section>
        ))}
      </div>
    </article>
  )
}
