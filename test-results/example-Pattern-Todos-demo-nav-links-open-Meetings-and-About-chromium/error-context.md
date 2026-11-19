# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: example.spec.ts >> Pattern Todos demo >> nav links open Meetings and About
- Location: tests/example.spec.ts:28:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /patterns this app demonstrates/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: /patterns this app demonstrates/i }) with timeout 5000ms
  - waiting for getByRole('heading', { name: /patterns this app demonstrates/i })

```

```yaml
- link "Skip to main content":
  - /url: "#main"
- banner:
  - link "Pattern Todos":
    - /url: /
  - navigation "Primary":
    - link "Tasks":
      - /url: /
    - link "Meetings":
      - /url: /meetings
    - link "About":
      - /url: /about
- main:
  - article:
    - paragraph: About
    - heading "Pattern Todos" [level=1]
    - paragraph: A small Vite + React app for capturing tasks and planning meetings without a backend.
    - heading "Tasks" [level=2]
    - paragraph: Add work, filter via the URL, and undo a delete for a few seconds.
    - heading "Meetings" [level=2]
    - paragraph: Schedule in the current month. Overlapping ranges are rejected.
    - heading "Local-first" [level=2]
    - paragraph: Data stays in this browser with a versioned storage schema.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | /**
  4  |  * Simple Playwright demo against Pattern Todos.
  5  |  * Run: npx playwright test
  6  |  * UI:  npx playwright test --ui
  7  |  */
  8  | test.describe('Pattern Todos demo', () => {
  9  |   test('home page shows the todo heading', async ({ page }) => {
  10 |     await page.goto('/')
  11 | 
  12 |     await expect(page).toHaveTitle(/pattern/i)
  13 |     await expect(
  14 |       page.getByRole('heading', { name: /capture work/i }),
  15 |     ).toBeVisible()
  16 |     await expect(page.getByLabel('New Task')).toBeVisible()
  17 |   })
  18 | 
  19 |   test('can add a task', async ({ page }) => {
  20 |     await page.goto('/')
  21 | 
  22 |     await page.getByLabel('New Task').fill('Buy oat milk')
  23 |     await page.getByRole('button', { name: 'Add Task' }).click()
  24 | 
  25 |     await expect(page.getByText('Buy oat milk')).toBeVisible()
  26 |   })
  27 | 
  28 |   test('nav links open Meetings and About', async ({ page }) => {
  29 |     await page.goto('/')
  30 | 
  31 |     await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Meetings' }).click()
  32 |     await expect(page).toHaveURL(/\/meetings/)
  33 |     await expect(
  34 |       page.getByRole('heading', { name: /plan this month/i }),
  35 |     ).toBeVisible()
  36 | 
  37 |     await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'About' }).click()
  38 |     await expect(page).toHaveURL(/\/about/)
  39 |     await expect(
  40 |       page.getByRole('heading', { name: /patterns this app demonstrates/i }),
> 41 |     ).toBeVisible()
     |       ^ Error: expect(locator).toBeVisible() failed
  42 |   })
  43 | })
  44 | 
```