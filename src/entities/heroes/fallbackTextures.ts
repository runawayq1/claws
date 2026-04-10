import type Phaser from 'phaser'
import type { HeroType } from '../Player'

/**
 * Generates a 64×64 pixel-art fallback texture for a hero when the real
 * spritesheet isn't available (placeholder heroes, test scenes).
 *
 * This file intentionally lives outside Player.ts — it's ~390 lines of
 * pure draw calls per hero with no shared logic. Keeping it here prevents
 * bloating Player's update/combat hot paths with scroll-through weight.
 */
export function generateHeroFallbackTexture(scene: Phaser.Scene, heroType: HeroType): void {
  const key = `hero_${heroType}`
  if (scene.textures.exists(key)) return

  const g = scene.add.graphics()
  const w = 64, h = 64

  switch (heroType) {
    case 'ignara': {
      // === IGNARA — Fire Sorceress ===
      // Feet / boots
      g.fillStyle(0x8b4513)
      g.fillRect(22, 56, 6, 6); g.fillRect(36, 56, 6, 6)
      g.fillStyle(0x6b3410)
      g.fillRect(22, 60, 6, 2); g.fillRect(36, 60, 6, 2)

      // Legs
      g.fillStyle(0xc0392b)
      g.fillRect(24, 46, 5, 12); g.fillRect(36, 46, 5, 12)

      // Robe body — flowing red with orange trim
      g.fillStyle(0xc0392b)
      g.fillRoundedRect(18, 26, 28, 22, 3)
      // Robe darker inner fold
      g.fillStyle(0x922b21)
      g.fillRect(26, 30, 12, 16)
      // Orange trim at edges
      g.fillStyle(0xe67e22)
      g.fillRect(18, 26, 2, 22); g.fillRect(44, 26, 2, 22)
      // Belt
      g.fillStyle(0xf39c12)
      g.fillRect(19, 36, 26, 3)
      g.fillStyle(0xe74c3c)
      g.fillCircle(32, 37, 2) // belt jewel

      // Arms — robe sleeves
      g.fillStyle(0xc0392b)
      g.fillRect(10, 28, 8, 14); g.fillRect(46, 28, 8, 14)
      g.fillStyle(0xe67e22) // cuff trim
      g.fillRect(10, 40, 8, 2); g.fillRect(46, 40, 8, 2)

      // Hands — skin tone
      g.fillStyle(0xe8b88a)
      g.fillRect(11, 42, 6, 4); g.fillRect(47, 42, 6, 4)

      // Left hand holds fireball
      g.fillStyle(0xff6600, 0.7)
      g.fillCircle(14, 48, 5)
      g.fillStyle(0xffaa00, 0.8)
      g.fillCircle(14, 47, 3)
      g.fillStyle(0xffdd44)
      g.fillCircle(14, 46, 1.5)

      // Neck
      g.fillStyle(0xe8b88a)
      g.fillRect(28, 22, 8, 6)

      // Head
      g.fillStyle(0xe8b88a)
      g.fillCircle(32, 16, 8)

      // Hair — fiery red/orange
      g.fillStyle(0xd35400)
      g.fillEllipse(32, 10, 18, 10)
      g.fillStyle(0xe74c3c)
      g.fillRect(23, 6, 18, 6)
      // Hair flowing down sides
      g.fillStyle(0xd35400)
      g.fillRect(22, 10, 3, 10); g.fillRect(39, 10, 3, 10)

      // Face
      g.fillStyle(0x2c3e50) // eyes
      g.fillRect(28, 14, 3, 3); g.fillRect(34, 14, 3, 3)
      g.fillStyle(0xffffff) // eye whites
      g.fillRect(28, 14, 2, 2); g.fillRect(34, 14, 2, 2)
      g.fillStyle(0xc0392b) // lips
      g.fillRect(30, 19, 4, 1)

      // Fire crown / circlet
      g.fillStyle(0xf1c40f)
      g.fillRect(25, 8, 14, 2)
      g.fillStyle(0xff6600)
      g.fillCircle(32, 6, 2) // crown gem
      g.fillStyle(0xf39c12)
      g.fillCircle(28, 7, 1); g.fillCircle(36, 7, 1)
      break
    }

    case 'sifra': {
      // === SIFRA — Ice Mage / Frost Scholar ===
      // Feet — light boots
      g.fillStyle(0x5dade2)
      g.fillRect(23, 56, 6, 6); g.fillRect(35, 56, 6, 6)
      g.fillStyle(0x2e86c1)
      g.fillRect(23, 60, 6, 2); g.fillRect(35, 60, 6, 2)

      // Legs
      g.fillStyle(0x85c1e9)
      g.fillRect(24, 44, 5, 14); g.fillRect(36, 44, 5, 14)

      // Robe body — icy blue with white accents
      g.fillStyle(0x5dade2)
      g.fillRoundedRect(18, 24, 28, 24, 4)
      // Inner robe fold
      g.fillStyle(0x3498db)
      g.fillRect(28, 28, 8, 18)
      // Frost patterns on robe
      g.fillStyle(0xd6eaf8, 0.5)
      g.fillCircle(24, 34, 2); g.fillCircle(40, 38, 2); g.fillCircle(22, 42, 1.5)
      // White fur collar
      g.fillStyle(0xecf0f1)
      g.fillEllipse(32, 26, 26, 6)
      g.fillStyle(0xd5dbdb)
      g.fillEllipse(32, 26, 22, 4)
      // Belt — silver
      g.fillStyle(0xbdc3c7)
      g.fillRect(19, 38, 26, 2)
      g.fillStyle(0x00d2d3)
      g.fillCircle(32, 39, 2) // ice crystal buckle

      // Arms
      g.fillStyle(0x5dade2)
      g.fillRect(10, 26, 8, 14); g.fillRect(46, 26, 8, 14)
      // Cuff frost trim
      g.fillStyle(0xecf0f1)
      g.fillRect(10, 38, 8, 2); g.fillRect(46, 38, 8, 2)

      // Hands
      g.fillStyle(0xfdebd0)
      g.fillRect(11, 40, 5, 4); g.fillRect(48, 40, 5, 4)

      // Staff — right hand (ice crystal staff)
      g.fillStyle(0x85c1e9)
      g.fillRect(50, 14, 3, 34) // shaft
      g.fillStyle(0xaed6f1)
      g.fillRect(50, 14, 3, 2) // shaft detail
      // Crystal top
      g.fillStyle(0x00d2d3)
      g.fillTriangle(51, 6, 47, 14, 55, 14)
      g.fillStyle(0x76d7ea, 0.7)
      g.fillTriangle(51, 8, 48, 13, 54, 13)
      // Crystal glow
      g.fillStyle(0xaaeeff, 0.3)
      g.fillCircle(51, 10, 6)

      // Neck
      g.fillStyle(0xfdebd0)
      g.fillRect(28, 20, 8, 6)

      // Head
      g.fillStyle(0xfdebd0)
      g.fillCircle(32, 14, 8)

      // Hair — white/silver
      g.fillStyle(0xd5f5e3)
      g.fillEllipse(32, 9, 18, 10)
      g.fillStyle(0xabebc6)
      g.fillRect(24, 4, 16, 6)
      // Hair side strands
      g.fillStyle(0xd5f5e3)
      g.fillRect(22, 8, 3, 12); g.fillRect(39, 8, 3, 12)

      // Face
      g.fillStyle(0x2e86c1) // eyes — icy blue
      g.fillRect(28, 13, 3, 3); g.fillRect(34, 13, 3, 3)
      g.fillStyle(0xaed6f1) // eye highlights
      g.fillRect(28, 13, 2, 2); g.fillRect(34, 13, 2, 2)
      // Lips
      g.fillStyle(0xe8b4b8)
      g.fillRect(30, 19, 4, 1)

      // Circlet — ice
      g.fillStyle(0x85c1e9)
      g.fillRect(25, 7, 14, 2)
      g.fillStyle(0x00d2d3)
      g.fillCircle(32, 6, 2)
      break
    }

    case 'amun': {
      // === AMUN — Pharaoh Guardian ===
      // Feet — golden sandals
      g.fillStyle(0xd4a017)
      g.fillRect(22, 56, 7, 6); g.fillRect(35, 56, 7, 6)
      g.fillStyle(0xb8860b)
      g.fillRect(22, 60, 7, 2); g.fillRect(35, 60, 7, 2)

      // Legs — white linen skirt
      g.fillStyle(0xfdfefe)
      g.fillRect(20, 40, 24, 18)
      g.fillStyle(0xeaecee)
      g.fillRect(30, 40, 2, 18) // center fold
      // Gold trim on skirt
      g.fillStyle(0xf1c40f)
      g.fillRect(20, 40, 24, 2)
      g.fillRect(20, 56, 24, 2)

      // Torso — golden armor
      g.fillStyle(0xf1c40f)
      g.fillRoundedRect(18, 22, 28, 20, 3)
      // Chest plate — pharaoh eagle emblem
      g.fillStyle(0xd4a017)
      g.fillRect(24, 24, 16, 14)
      g.fillStyle(0xf39c12)
      g.fillTriangle(32, 24, 26, 36, 38, 36) // emblem
      g.fillStyle(0x00bcd4) // turquoise inlay
      g.fillCircle(32, 30, 3)
      g.fillStyle(0x00838f)
      g.fillCircle(32, 30, 1.5)
      // Shoulder pauldrons
      g.fillStyle(0xf1c40f)
      g.fillEllipse(16, 24, 10, 8)
      g.fillEllipse(48, 24, 10, 8)
      g.fillStyle(0xd4a017) // pauldron detail
      g.lineStyle(1, 0xb8860b)
      g.strokeCircle(16, 24, 3); g.strokeCircle(48, 24, 3)

      // Arms
      g.fillStyle(0xc68642) // skin
      g.fillRect(10, 26, 8, 14); g.fillRect(46, 26, 8, 14)
      // Gold arm bands
      g.fillStyle(0xf1c40f)
      g.fillRect(10, 28, 8, 2); g.fillRect(46, 28, 8, 2)
      g.fillRect(10, 34, 8, 2); g.fillRect(46, 34, 8, 2)

      // Hands
      g.fillStyle(0xc68642)
      g.fillRect(11, 40, 6, 4); g.fillRect(47, 40, 6, 4)

      // Shield — left hand (ankh shaped)
      g.fillStyle(0xd4a017)
      g.fillRect(4, 24, 10, 22)
      g.fillStyle(0xf1c40f)
      g.fillRect(5, 25, 8, 20)
      // Ankh symbol on shield
      g.fillStyle(0x00bcd4)
      g.fillCircle(9, 30, 3)
      g.fillStyle(0xf1c40f)
      g.fillCircle(9, 30, 1.5)
      g.fillStyle(0x00bcd4)
      g.fillRect(8, 33, 2, 8)
      g.fillRect(6, 36, 6, 2)

      // Head — pharaoh headdress
      g.fillStyle(0xc68642) // face skin
      g.fillCircle(32, 14, 8)
      // Nemes headdress (striped)
      g.fillStyle(0x1a237e)
      g.fillRect(22, 4, 20, 12)
      g.fillStyle(0xf1c40f)
      g.fillRect(24, 4, 2, 12); g.fillRect(28, 4, 2, 12)
      g.fillRect(32, 4, 2, 12); g.fillRect(36, 4, 2, 12)
      g.fillRect(40, 4, 2, 12)
      // Headdress sides flowing down
      g.fillStyle(0x1a237e)
      g.fillRect(20, 10, 4, 16); g.fillRect(40, 10, 4, 16)
      g.fillStyle(0xf1c40f) // gold stripes on sides
      g.fillRect(20, 12, 4, 2); g.fillRect(40, 12, 4, 2)
      g.fillRect(20, 18, 4, 2); g.fillRect(40, 18, 4, 2)
      // Uraeus (cobra) on forehead
      g.fillStyle(0xf1c40f)
      g.fillCircle(32, 5, 2)
      g.fillStyle(0xff0000)
      g.fillCircle(32, 4, 1) // ruby eye

      // Face
      g.fillStyle(0xffffff) // eyes
      g.fillRect(28, 12, 3, 3); g.fillRect(34, 12, 3, 3)
      g.fillStyle(0x1a1a1a) // pupils
      g.fillRect(29, 13, 2, 2); g.fillRect(35, 13, 2, 2)
      // Kohl eyeliner (Egyptian style)
      g.lineStyle(1, 0x1a1a1a)
      g.lineBetween(26, 13, 28, 13); g.lineBetween(37, 13, 39, 13)
      // Gold aura glow
      g.fillStyle(0xfff59d, 0.15)
      g.fillCircle(32, 32, 24)
      break
    }

    case 'nazar': {
      // === NAZAR — Plague Doctor ===
      // Feet — heavy boots
      g.fillStyle(0x34495e)
      g.fillRect(22, 56, 6, 6); g.fillRect(36, 56, 6, 6)
      g.fillStyle(0x2c3e50)
      g.fillRect(22, 60, 6, 2); g.fillRect(36, 60, 6, 2)
      // Boot buckles
      g.fillStyle(0x7f8c8d)
      g.fillRect(24, 56, 2, 1); g.fillRect(38, 56, 2, 1)

      // Legs
      g.fillStyle(0x515a5a)
      g.fillRect(24, 44, 5, 14); g.fillRect(36, 44, 5, 14)

      // Long coat body — dark grey-green
      g.fillStyle(0x515a5a)
      g.fillRoundedRect(16, 22, 32, 26, 3)
      // Coat inner lining — darker
      g.fillStyle(0x3d4646)
      g.fillRect(26, 26, 12, 20)
      // Coat buttons
      g.fillStyle(0x7f8c8d)
      g.fillCircle(32, 28, 1); g.fillCircle(32, 32, 1)
      g.fillCircle(32, 36, 1); g.fillCircle(32, 40, 1)
      // Coat flared bottom
      g.fillStyle(0x515a5a)
      g.fillTriangle(16, 46, 14, 56, 24, 56)
      g.fillTriangle(48, 46, 50, 56, 40, 56)
      // Belt with vials
      g.fillStyle(0x6b4226)
      g.fillRect(17, 38, 30, 3)
      // Potion vials on belt
      g.fillStyle(0xa3cb38)
      g.fillRect(20, 36, 3, 4); g.fillRect(26, 36, 3, 4)
      g.fillStyle(0x009432)
      g.fillRect(41, 36, 3, 4)
      g.fillStyle(0xf39c12)
      g.fillRect(35, 36, 3, 4)

      // Arms — coat sleeves
      g.fillStyle(0x515a5a)
      g.fillRect(8, 24, 8, 16); g.fillRect(48, 24, 8, 16)
      // Cuff detail
      g.fillStyle(0x3d4646)
      g.fillRect(8, 38, 8, 2); g.fillRect(48, 38, 8, 2)

      // Gloved hands
      g.fillStyle(0x2c3e50)
      g.fillRect(9, 40, 6, 4); g.fillRect(49, 40, 6, 4)

      // Right hand — poison vial (large)
      g.fillStyle(0x2ecc71, 0.7)
      g.fillRoundedRect(50, 42, 8, 10, 2)
      g.fillStyle(0x27ae60)
      g.fillRect(52, 40, 4, 3) // vial neck
      g.fillStyle(0x6b4226)
      g.fillRect(52, 39, 4, 2) // cork
      // Bubbles in vial
      g.fillStyle(0x82e0aa, 0.6)
      g.fillCircle(54, 47, 1.5); g.fillCircle(52, 49, 1)

      // Neck
      g.fillStyle(0x515a5a)
      g.fillRect(28, 18, 8, 6)

      // Head — plague doctor mask
      g.fillStyle(0x2d3436)
      g.fillCircle(32, 12, 9)
      // Hat — wide brim
      g.fillStyle(0x2d3436)
      g.fillEllipse(32, 6, 24, 6)
      g.fillStyle(0x1a1a2e)
      g.fillRect(26, 2, 12, 6) // hat crown
      // Hat band
      g.fillStyle(0x6b4226)
      g.fillRect(26, 6, 12, 2)
      g.fillStyle(0xa3cb38) // green feather accent
      g.fillRect(38, 2, 2, 6)

      // Plague mask beak
      g.fillStyle(0xbaaa7c)
      g.fillTriangle(32, 12, 24, 18, 32, 24)
      g.fillStyle(0xa89060)
      g.fillTriangle(32, 14, 26, 18, 32, 22)
      // Mask nostril detail
      g.fillStyle(0x2d3436)
      g.fillCircle(28, 18, 1)

      // Eye lenses — yellow/green glow
      g.fillStyle(0xfdcb6e)
      g.fillCircle(28, 10, 3); g.fillCircle(36, 10, 3)
      g.fillStyle(0xf9e79f)
      g.fillCircle(28, 10, 1.5); g.fillCircle(36, 10, 1.5)
      // Lens frame
      g.lineStyle(1, 0x2d3436)
      g.strokeCircle(28, 10, 3); g.strokeCircle(36, 10, 3)

      // Poison drip effect from vial
      g.fillStyle(0xa3cb38, 0.5)
      g.fillCircle(54, 54, 2)
      g.fillCircle(55, 57, 1)
      break
    }
  }

  g.generateTexture(key, w, h)
  g.destroy()
}
