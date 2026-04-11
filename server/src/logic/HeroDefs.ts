// Server-side hero definitions — mirrors client HERO_DEFS in Player.ts

export interface HeroDef {
  hp: number
  speed: number
  damage: number
  range: number
  cooldown: number
  attackPattern: 'single' | 'aoe' | 'cone' | 'line'
  splashRadius?: number       // for aoe: all enemies within this range of target take damage
  coneAngle?: number          // for cone: degrees (default 90)
  stances?: string[]          // list of stance names, first is default
  altStanceDamageMult?: number // damage multiplier in non-default stance
  altStanceRangeMult?: number  // range multiplier in non-default stance
}

export const HERO_DEFS: Record<string, HeroDef> = {
  ignara:   { hp: 80,  speed: 140, damage: 30, range: 180, cooldown: 700,  attackPattern: 'aoe',    splashRadius: 80,  stances: ['fire'] },
  sifra:    { hp: 70,  speed: 150, damage: 12, range: 160, cooldown: 800,  attackPattern: 'aoe',    splashRadius: 60,  stances: ['ice', 'lightning'],     altStanceDamageMult: 1.3, altStanceRangeMult: 1.2 },
  amun:     { hp: 160, speed: 120, damage: 22, range: 65,  cooldown: 800,  attackPattern: 'aoe',    splashRadius: 100, stances: ['melee', 'quake'],        altStanceDamageMult: 1.2, altStanceRangeMult: 1.5 },
  nazar:    { hp: 90,  speed: 140, damage: 18, range: 55,  cooldown: 400,  attackPattern: 'single',              stances: ['sword', 'venom'],        altStanceDamageMult: 1.1 },
  huntress: { hp: 80,  speed: 140, damage: 18, range: 300, cooldown: 500,  attackPattern: 'line',                stances: ['ranged', 'melee'],       altStanceDamageMult: 1.4 },
  khashin:  { hp: 90,  speed: 140, damage: 18, range: 160, cooldown: 900,  attackPattern: 'cone',   coneAngle: 110,   stances: ['sirocco', 'haboob'],     altStanceDamageMult: 1.2 },
  muller:   { hp: 160, speed: 110, damage: 38, range: 260, cooldown: 1100, attackPattern: 'single',              stances: ['shield'] },
}
