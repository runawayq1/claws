/** Detects touch-primary devices (phone/tablet). Includes touch-enabled desktops via maxTouchPoints. */
export function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1
}

/** UA-only check (excludes touch-desktop). Use when you need UA-only semantics. */
export function isMobileUserAgent(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

/** True when viewport is taller than wide (portrait orientation). Call at runtime — not cached. */
export function isPortrait(): boolean {
  return window.innerHeight > window.innerWidth
}

/** System font stack matching Apple UI style. */
export const SYSTEM_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

/** Returns system font for all platforms. Use for all in-game text. */
export function gameFont(): string {
  return SYSTEM_FONT
}
