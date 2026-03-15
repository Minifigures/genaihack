import { test, expect } from '@playwright/test'

test.describe('Navigation (unauthenticated)', () => {
  test('navbar does not show nav items when logged out', async ({ page }) => {
    await page.goto('/')
    // Nav items like Upload, Cases, etc should be hidden for non-auth users
    await expect(page.getByRole('link', { name: 'VIGIL' })).toBeVisible()
    // The authenticated nav links should NOT be visible
    const uploadLink = page.locator('nav').getByRole('link', { name: 'Upload' })
    await expect(uploadLink).not.toBeVisible()
  })

  test('protected routes redirect to login', async ({ page }) => {
    await page.goto('/upload')
    // AuthGuard should redirect to /login
    await expect(page).toHaveURL('/login', { timeout: 10000 })
  })

  test('protected route /cases redirects to login', async ({ page }) => {
    await page.goto('/cases')
    await expect(page).toHaveURL('/login', { timeout: 10000 })
  })

  test('protected route /benefits redirects to login', async ({ page }) => {
    await page.goto('/benefits')
    await expect(page).toHaveURL('/login', { timeout: 10000 })
  })

  test('protected route /logs redirects to login', async ({ page }) => {
    await page.goto('/logs')
    await expect(page).toHaveURL('/login', { timeout: 10000 })
  })
})

test.describe('Page titles and metadata', () => {
  test('has correct page title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/VIGIL/)
  })
})
