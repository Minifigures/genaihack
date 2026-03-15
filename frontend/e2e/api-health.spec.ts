import { test, expect } from '@playwright/test'

test.describe('Backend API Health', () => {
  test('backend health endpoint responds', async ({ request }) => {
    const response = await request.get('http://localhost:8000/docs')
    expect(response.status()).toBe(200)
  })

  test('claims endpoint responds (demo mode)', async ({ request }) => {
    const response = await request.get('http://localhost:8000/api/claims')
    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('claims')
  })

  test('cases endpoint responds (demo mode)', async ({ request }) => {
    const response = await request.get('http://localhost:8000/api/cases')
    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('cases')
  })

  test('metrics endpoint responds', async ({ request }) => {
    const response = await request.get('http://localhost:8000/api/metrics')
    expect(response.status()).toBe(200)
  })

  test('audit endpoint responds', async ({ request }) => {
    const response = await request.get('http://localhost:8000/api/audit')
    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('entries')
  })

  test('providers endpoint responds', async ({ request }) => {
    const response = await request.get('http://localhost:8000/api/providers')
    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('providers')
  })
})
