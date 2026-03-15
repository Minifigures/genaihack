import { test, expect } from '@playwright/test'

test.describe('Login Page', () => {
  test('renders login form correctly', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Sign in to your account')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  })

  test('has link to signup page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('link', { name: 'create a new account' })).toBeVisible()
    await page.getByRole('link', { name: 'create a new account' }).click()
    await expect(page).toHaveURL('/signup')
  })

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="email"]').fill('fake@notreal.com')
    await page.locator('input[type="password"]').fill('wrongpassword123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    // Should show an error message (shadcn Alert or text-red)
    await expect(page.locator('[role="alert"], .text-red-500, .text-destructive')).toBeVisible({ timeout: 10000 })
  })

  test('email field validates email format', async ({ page }) => {
    await page.goto('/login')
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toHaveAttribute('type', 'email')
    await expect(emailInput).toHaveAttribute('required', '')
  })

  test('password field is masked', async ({ page }) => {
    await page.goto('/login')
    const pwInput = page.locator('input[type="password"]')
    await expect(pwInput).toHaveAttribute('type', 'password')
  })
})

test.describe('Signup Page', () => {
  test('renders signup form correctly', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.getByText('Create a new account')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign up' })).toBeVisible()
  })

  test('has link to login page', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.getByRole('link', { name: 'sign in to your existing account' })).toBeVisible()
    await page.getByRole('link', { name: 'sign in to your existing account' }).click()
    await expect(page).toHaveURL('/login')
  })
})
