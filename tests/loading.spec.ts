import { test, expect } from '@playwright/test'

test('measure loading time', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })

  const perfLogs: string[] = []
  page.on('console', msg => {
    const t = msg.text()
    if (t.includes('[PERF]')) { perfLogs.push(t); console.log(`  ${t}`) }
  })
  page.on('pageerror', err => console.log(`  [ERR] ${err.message}`))

  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('claws_player_name', 'Tester'))
  await page.reload()

  const canvas = page.locator('canvas')
  await expect(canvas).toBeVisible({ timeout: 10000 })
  await page.waitForTimeout(1500)

  // Inject precise perf markers
  await page.evaluate(() => {
    const g = (window as any).__PHASER_GAME__
    if (!g) return
    for (const s of g.scene.scenes) {
      const key = s.scene.key
      s.events.on('create', () => console.log(`[PERF] ${key} create @ ${performance.now().toFixed(0)}ms`))
      s.events.on('terrain-ready', () => console.log(`[PERF] ${key} terrain-ready @ ${performance.now().toFixed(0)}ms`))
    }
  })

  // Record precise timing
  await page.evaluate(() => { (window as any).__T0__ = performance.now() })

  // Click first hero
  await canvas.click({ position: { x: 268, y: 331 } })
  const wallT0 = Date.now()
  console.log('Hero clicked — measuring...')

  // Poll every 200ms for player.active
  let readyMs = -1
  for (let i = 0; i < 150; i++) {
    await page.waitForTimeout(200)
    const ready = await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__
      if (!g) return false
      const gs = g.scene.getScene('GameScene') || g.scene.getScene('UndeadMapScene')
      return !!(gs?.player?.active)
    })
    if (ready) {
      readyMs = Date.now() - wallT0
      break
    }
  }

  // Get browser-side timing
  const browserMs = await page.evaluate(() => {
    return Math.round(performance.now() - (window as any).__T0__)
  })

  console.log(`\n=== RESULTS ===`)
  console.log(`  Wall time (click → player ready): ${readyMs}ms`)
  console.log(`  Browser perf.now delta: ${browserMs}ms`)
  console.log(`\nPerf marks:`)
  for (const l of perfLogs) console.log(`  ${l}`)

  await page.screenshot({ path: 'tests/final-state.png' })
  expect(readyMs).toBeGreaterThan(0)
  expect(readyMs).toBeLessThan(15000) // Should load in under 15s
})
