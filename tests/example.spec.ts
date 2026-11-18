import { test, expect } from '@playwright/test'

/**
 * Simple Playwright demo against Pattern Todos.
 * Run: npx playwright test
 * UI:  npx playwright test --ui
 */
test.describe('Pattern Todos demo', () => {
  test('home page shows the todo heading', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/pattern/i)
    await expect(
      page.getByRole('heading', { name: /capture work/i }),
    ).toBeVisible()
    await expect(page.getByLabel('New Task')).toBeVisible()
  })

  test('can add a task', async ({ page }) => {
    await page.goto('/')

    await page.getByLabel('New Task').fill('Buy oat milk')
    await page.getByRole('button', { name: 'Add Task' }).click()

    await expect(page.getByText('Buy oat milk')).toBeVisible()
  })

  test('nav links open Meetings and About', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Meetings' }).click()
    await expect(page).toHaveURL(/\/meetings/)
    await expect(
      page.getByRole('heading', { name: /plan this month/i }),
    ).toBeVisible()

    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'About' }).click()
    await expect(page).toHaveURL(/\/about/)
    await expect(
      page.getByRole('heading', { name: /patterns this app demonstrates/i }),
    ).toBeVisible()
  })
})
