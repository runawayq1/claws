// Server-side hero definitions — mirrors client HERO_DEFS in Player.ts

export interface HeroDef {
  hp: number
  speed: number
  damage: number
  range: number
  cooldown: number
}

export const HERO_DEFS: Record<string, HeroDef> = {
  ignara:   { hp: 80,  speed: 140, damage: 30, range: 180, cooldown: 700 },
  sifra:    { hp: 70,  speed: 150, damage: 12, range: 160, cooldown: 800 },
  amun:     { hp: 160, speed: 120, damage: 22, range: 65,  cooldown: 800 },
  nazar:    { hp: 90,  speed: 140, damage: 18, range: 55,  cooldown: 400 },
  huntress: { hp: 80,  speed: 140, damage: 18, range: 300, cooldown: 500 },
  khashin:  { hp: 90,  speed: 140, damage: 18, range: 160, cooldown: 900 },
  muller:   { hp: 160, speed: 110, damage: 38, range: 260, cooldown: 1100 },
}
