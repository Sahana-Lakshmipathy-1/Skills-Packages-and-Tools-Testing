# Pattern Todos

A lean Vite + React + TypeScript todo app that demonstrates three Vercel agent skills:

- **Composition Patterns** — compound `Todo.*` components, lifted provider state, `{ state, actions, meta }` context
- **React Best Practices** — lazy localStorage init, versioned storage, `startTransition` for filters, derived counts
- **Web Design Guidelines** — accessible forms, URL-synced filters, undo toast, focus and motion rules

## Scripts

```bash
npm run dev
npm run build
npm run preview
```

## Routes

- `/` — todo list (`?filter=all|active|completed`)
- `/about` — patterns this app demonstrates

Skills live in `.agents/skills/`.
