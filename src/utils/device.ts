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
