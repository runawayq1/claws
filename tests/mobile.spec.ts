/**
 * Mobile viewport tests against the live deployment.
 * Tests landscape orientation for iPhone 13 and Pixel 5.
 *
 * Note: device descriptors' defaultBrowserType is omitted so tests run under
 * Chromium (the installed browser). Viewport, UA, touch, and scale are faithful.
 */
import { test, expect, devices } from '@playwright/test'

const LIVE_URL = 'https://claws-chi.vercel.app'

// Strip defaultBrowserType so test.use() works inside describe blocks
function mobileDevice(name: string) {
  const { defaultBrowserType: _drop, ...rest } = devices[name] as any
  return rest
}

// ── Shared test suite ─────────────────────────────────────────────────────

function runMobileSuite(deviceName: string) {
  test.describe(deviceName, () => {
    test.use(mobileDevice(deviceName))

    test('canvas is visible on load', async ({ page }) => {
      await page.goto(LIVE_URL, { waitUntil: 'networkidle', timeout: 30000 })
      const canvas = page.locator('canvas')
      await expect(canvas).toBeVisible({ timeout: 15000 })
    })

    test('no rotate-device overlay is shown', async ({ page }) => {
      await page.goto(LIVE_URL, { waitUntil: 'networkidle', timeout: 30000 })
      // Give Phaser time to set up the DOM fully
      await page.waitForTimeout(3000)

      // Check for common rotate-overlay element patterns
      const overlay = page.locator(
        '[class*="rotate"], [id*="rotate"], [class*="portrait"], [id*="portrait"]'
      )
      expect(await overlay.count()).toBe(0)

      // Also check visible text
      const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase())
      expect(bodyText).not.toContain('rotate your device')
      expect(bodyText).not.toContain('please rotate')
    })

    test('PWA manifest is accessible and contains name CLAWS', async ({ page }) => {
      const response = await page.request.get(`${LIVE_URL}/manifest.json`)
      expect(response.status()).toBe(200)
      const ct = response.headers()['content-type'] ?? ''
      expect(ct).toMatch(/json/)
      const manifest = await response.json()
      expect(typeof manifest).toBe('object')
      expect(manifest.name).toBe('CLAWS')
    })

    test('service worker registers successfully', async ({ page }) => {
      await page.goto(LIVE_URL, { waitUntil: 'networkidle', timeout: 30000 })
      await page.waitForTimeout(3000)
      const swRegistered = await page.evaluate(async () => {
        if (!('serviceWorker' in navigator)) return false
        try {
          const reg = await navigator.serviceWorker.getRegistration('/')
          return reg !== undefined
        } catch {
          return false
        }
      })
      expect(swRegistered).toBe(true)
    })

    test('canvas fills the viewport', async ({ page }) => {
      await page.goto(LIVE_URL, { waitUntil: 'networkidle', timeout: 30000 })
      const canvas = page.locator('canvas')
      await expect(canvas).toBeVisible({ timeout: 15000 })

      const box = await canvas.boundingBox()
      const vp = page.viewportSize()!
      expect(box).not.toBeNull()

      // Allow ±20% tolerance for Phaser letterboxing/scaling
      expect(box!.width).toBeGreaterThan(vp.width * 0.8)
      expect(box!.height).toBeGreaterThan(vp.height * 0.8)
    })
  })
}

// ── Run for both devices ───────────────────────────────────────────────────

runMobileSuite('iPhone 13 landscape')
runMobileSuite('Pixel 5 landscape')
