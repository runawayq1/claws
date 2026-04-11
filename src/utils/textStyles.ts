import { gameFont, isMobileUserAgent } from './device'

/**
 * Centralized text style definitions.
 * All scenes should import from here instead of hardcoding font sizes/colors.
 * Shadow replaces stroke for clean Apple-UI look.
 */

const mob = () => isMobileUserAgent()

// ─── Font Sizes ──────────────────────────────────────────────────────────────

export const FONT = {
  /** Big scene titles: LEVEL UP, CHOOSE YOUR PATH */
  title: () => mob() ? '24px' : '36px',
  /** Section headers: hero name, category */
  header: () => mob() ? '18px' : '22px',
  /** Card titles, skill names */
  cardTitle: () => mob() ? '16px' : '14px',
  /** Body text, descriptions */
  body: () => mob() ? '14px' : '12px',
  /** Small labels, hints, secondary info */
  small: () => mob() ? '12px' : '10px',
  /** Tiny badges, level indicators */
  tiny: () => mob() ? '11px' : '9px',
}

// ─── Colors ──────────────────────────────────────────────────────────────────

export const TEXT_COLOR = {
  gold: '#FFD700',
  white: '#ffffff',
  light: '#dddddd',
  muted: '#aaaaaa',
  dim: '#777777',
  green: '#88ff88',
  red: '#ff6666',
  blue: '#88ccff',
}

// ─── Style Presets ───────────────────────────────────────────────────────────

export function titleStyle(color = TEXT_COLOR.gold): Phaser.Types.GameObjects.Text.TextStyle {
  return { fontFamily: gameFont(), fontSize: FONT.title(), color }
}

export function headerStyle(color = TEXT_COLOR.white): Phaser.Types.GameObjects.Text.TextStyle {
  return { fontFamily: gameFont(), fontSize: FONT.header(), color }
}

export function cardTitleStyle(color = TEXT_COLOR.gold): Phaser.Types.GameObjects.Text.TextStyle {
  return { fontFamily: gameFont(), fontSize: FONT.cardTitle(), color }
}

export function bodyStyle(color = TEXT_COLOR.light, width?: number): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: gameFont(),
    fontSize: FONT.body(),
    color,
    ...(width ? { wordWrap: { width }, align: 'center', lineSpacing: 2 } : {}),
  }
}

export function smallStyle(color = TEXT_COLOR.muted): Phaser.Types.GameObjects.Text.TextStyle {
  return { fontFamily: gameFont(), fontSize: FONT.small(), color }
}

// ─── Shadow Helper ───────────────────────────────────────────────────────────

/** Apply soft drop shadow (use on titles/headers only). */
export function applyShadow(text: Phaser.GameObjects.Text, blur = 3) {
  text.setShadow(0, 1, '#000000', blur, true, true)
}
