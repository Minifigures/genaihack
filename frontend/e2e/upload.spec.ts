import { test, expect } from '@playwright/test'

test.describe('Upload Page', () => {
  test('upload page redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/upload')
    // AuthGuard should redirect to /login
    await expect(page).toHaveURL('/login', { timeout: 10000 })
    await expect(page.getByText('Sign in to your account')).toBeVisible()
  })
})
