import { test, expect } from '@playwright/test'

test.describe('Landing Page (unauthenticated)', () => {
  test('shows hero section with SecureFlow AI branding', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText(/secureflow ai/i)
  })

  test('shows Get Started and Log In buttons', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Get Started' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Log In' })).toBeVisible()
  })

  test('Get Started links to signup page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Get Started' }).click()
    await expect(page).toHaveURL('/signup')
  })

  test('Log In links to login page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Log In' }).click()
    await expect(page).toHaveURL('/login')
  })

  test('shows healthcare fraud statistics section', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('The Cost of Healthcare Fraud in Canada')).toBeVisible()
    await expect(page.getByText('$600M - $3.4 Billion Annual Loss')).toBeVisible()
    await expect(page.getByText('Increased Premiums')).toBeVisible()
    await expect(page.getByText('Phantom & Upcoding')).toBeVisible()
    await expect(page.getByText('Collusion & Clinics')).toBeVisible()
  })

  test('shows VIGIL logo in navbar', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'VIGIL' })).toBeVisible()
    await expect(page.getByText('beta')).toBeVisible()
  })
})
