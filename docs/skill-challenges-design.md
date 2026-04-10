> **STATUS: NOT IMPLEMENTED** — Design only, no code exists yet. Last reviewed 2026-04-09.

# CLAWS — Skill Challenge System Design

**Version:** 1.0 | **Date:** 2026-04-06 | **Status:** Design (not yet implemented)

---

## Overview

The challenge system replaces the `UNLOCK_ALL = true` placeholder with a cross-raid progression layer. Each skill has a specific unlock condition — a **challenge** that players complete across multiple runs. Completing a challenge permanently unlocks that skill for all future runs.

### Design Goals

- Every challenge should feel **thematic** — fire skills earned through fire, shadow skills through stealth, etc.
- Challenges create **natural curiosity**: players try new heroes and maps to unlock things
- Difficulty scales with skill power: skill 1 of a branch is the cheapest ask, skill 5 is the steepest
- Some challenges create **cross-hero narrative hooks** (Ignara's fire teaches Amun something; Khashin notices Lyra)
- Generic skills reward **general mastery**, not hero-specific play

### How Unlocking Works

- On run end, `MetaProgress.recordSession()` is called — the challenge system hooks into this to check progress
- Each challenge has a `condition` (machine-readable) and a `challengeDesc` (displayed in the Encyclopedia skill tooltip before unlock)
- Locked skills appear grayed-out in the Encyclopedia with the challenge text visible — motivation to try
- Skills remain locked in-run if not yet unlocked (the upgrade panel simply does not show them)
- Progress toward multi-step conditions (e.g., "kill 500 enemies with fire") is stored in `meta.challengeProgress[skillId]` as a number
- All challenge state lives in `localStorage` under the existing `claws_meta` key, inside a new `challengeProgress` map and `skillUnlocks` set

---

## Condition Types Catalog

| Type | Shape | Description |
|------|-------|-------------|
| `play_any` | `{ type: 'play_any', count: N }` | Complete N runs of any hero/map |
| `play_hero` | `{ type: 'play_hero', hero: H, count: N }` | Complete N runs as specific hero |
| `win_hero` | `{ type: 'win_hero', hero: H }` | Win a run (survive 10 min) as hero H |
| `kills_total` | `{ type: 'kills_total', count: N }` | Accumulate N total kills across all runs |
| `kills_run` | `{ type: 'kills_run', count: N }` | Get N kills in a single run |
| `kills_hero` | `{ type: 'kills_hero', hero: H, count: N }` | Accumulate N kills while playing hero H |
| `kills_with_skill` | `{ type: 'kills_with_skill', skillId: S, count: N }` | Get N kills where the killing blow was skill S |
| `kills_enemy` | `{ type: 'kills_enemy', enemy: E, count: N }` | Kill N of a specific enemy type |
| `survive_minutes` | `{ type: 'survive_minutes', minutes: N }` | Survive N minutes in a single run |
| `survive_hero` | `{ type: 'survive_hero', hero: H, minutes: N }` | Survive N minutes as hero H in one run |
| `boss_kill` | `{ type: 'boss_kill' }` | Kill the boss (win a run) |
| `boss_kill_hero` | `{ type: 'boss_kill_hero', hero: H }` | Kill the boss as a specific hero |
| `boss_kill_no_hit` | `{ type: 'boss_kill_no_hit', hero: H }` | Kill the boss as hero H without being hit during boss fight |
| `reach_level` | `{ type: 'reach_level', level: N }` | Reach level N in a single run |
| `reach_level_hero` | `{ type: 'reach_level_hero', hero: H, level: N }` | Reach level N as specific hero |
| `choose_branch` | `{ type: 'choose_branch', branch: B }` | Choose branch B at least once (any run) |
| `max_branch` | `{ type: 'max_branch', branch: B }` | Take all 5 skills of branch B in a single run |
| `runs_on_map` | `{ type: 'runs_on_map', map: M, count: N }` | Complete N runs on a specific map |
| `win_on_map` | `{ type: 'win_on_map', map: M }` | Win a run on a specific map |
| `win_hero_map` | `{ type: 'win_hero_map', hero: H, map: M }` | Win a run as hero H on map M |
| `hero_then_hero` | `{ type: 'hero_then_hero', first: H1, then: H2 }` | Win a run as H1, then play any run as H2 |
| `kills_no_damage` | `{ type: 'kills_no_damage', count: N, seconds: S }` | Kill N enemies without taking damage for S seconds |
| `low_hp_kill` | `{ type: 'low_hp_kill', hp_pct: P, count: N }` | Kill N enemies while below P% HP |
| `multikill` | `{ type: 'multikill', count: N }` | Kill N enemies within 3 seconds |

---

## Generic Skills (10)

These unlock through general gameplay mastery regardless of hero choice.

```json
[
  {
    "skillId": "g1",
    "name": "Sharp Edge",
    "challengeTitle": "First Blood",
    "challengeDesc": "Get your first kill. Any weapon. Any enemy.",
    "condition": { "type": "kills_total", "count": 1 }
  },
  {
    "skillId": "g2",
    "name": "Swift Feet",
    "challengeTitle": "Keep Moving",
    "challengeDesc": "Complete 3 runs. The enemy adapts — so must you.",
    "condition": { "type": "play_any", "count": 3 }
  },
  {
    "skillId": "g3",
    "name": "Eagle Eye",
    "challengeTitle": "Clear Sight",
    "challengeDesc": "Reach level 5 in a single run. Enough XP to start seeing patterns.",
    "condition": { "type": "reach_level", "level": 5 }
  },
  {
    "skillId": "g4",
    "name": "Quick Hands",
    "challengeTitle": "Combat Rhythm",
    "challengeDesc": "Kill 100 enemies in a single run. Find the rhythm.",
    "condition": { "type": "kills_run", "count": 100 }
  },
  {
    "skillId": "g5",
    "name": "Vitality",
    "challengeTitle": "Will to Live",
    "challengeDesc": "Survive 5 minutes in a run. Endurance is its own kind of strength.",
    "condition": { "type": "survive_minutes", "minutes": 5 }
  },
  {
    "skillId": "g6",
    "name": "Regeneration",
    "challengeTitle": "Slow Recovery",
    "challengeDesc": "Win a run. Only those who finish learn what heals.",
    "condition": { "type": "boss_kill" }
  },
  {
    "skillId": "g7",
    "name": "Cleave",
    "challengeTitle": "Crowd Control",
    "challengeDesc": "Kill 10 enemies within 3 seconds. Precision means nothing here — sweep.",
    "condition": { "type": "multikill", "count": 10 }
  },
  {
    "skillId": "g8",
    "name": "Wisdom",
    "challengeTitle": "Student of the Swarm",
    "challengeDesc": "Reach level 10 in a single run. You've started to understand the Rift.",
    "condition": { "type": "reach_level", "level": 10 }
  },
  {
    "skillId": "g9",
    "name": "Multistrike",
    "challengeTitle": "Second Chance",
    "challengeDesc": "Kill 500 total enemies across all runs. The Swarm is endless. So are you.",
    "condition": { "type": "kills_total", "count": 500 }
  },
  {
    "skillId": "g10",
    "name": "Iron Skin",
    "challengeTitle": "Scar Tissue",
    "challengeDesc": "Win 3 runs with any combination of heroes. Pain teaches what armor cannot.",
    "condition": { "type": "play_any_wins", "count": 3 }
  }
]
```

---

## Ignara — Fire Mage

*The last student of the Flame Word. She came for revenge — her teacher opened the Gate.*

### Branch: Inferno (if1–if5)

*Theme: Raw fireball destruction. Challenges involve dealing fire damage and burning things.*

```json
[
  {
    "skillId": "if1",
    "name": "Wide Burn",
    "challengeTitle": "First Flame",
    "challengeDesc": "Choose the Inferno branch once. The fire always starts small.",
    "condition": { "type": "choose_branch", "branch": "inferno" }
  },
  {
    "skillId": "if2",
    "name": "Inferno Reach",
    "challengeTitle": "Long Arm of Fire",
    "challengeDesc": "Kill 200 enemies as Ignara. Learn the distance at which fire is still fire.",
    "condition": { "type": "kills_hero", "hero": "ignara", "count": 200 }
  },
  {
    "skillId": "if3",
    "name": "White Fire",
    "challengeTitle": "Hotter",
    "challengeDesc": "Kill 100 enemies in a single run as Ignara. The First Flame responds to focus.",
    "condition": { "type": "kills_run", "count": 100 },
    "conditionHero": "ignara"
  },
  {
    "skillId": "if4",
    "name": "Scorched Earth",
    "challengeTitle": "Leave Nothing",
    "challengeDesc": "Win a run as Ignara. The ground remembers fire for a long time.",
    "condition": { "type": "win_hero", "hero": "ignara" }
  },
  {
    "skillId": "if5",
    "name": "Firestorm",
    "challengeTitle": "She Becomes the Fire",
    "challengeDesc": "Max the Inferno branch in a single run. Reach level 15. The First Flame is fully awake.",
    "condition": { "type": "max_branch_and_level", "branch": "inferno", "level": 15 }
  }
]
```

### Branch: Fortress (io1–io5)

*Theme: Survivability through fire. Challenges involve taking and surviving damage.*

```json
[
  {
    "skillId": "io1",
    "name": "Heat Shield",
    "challengeTitle": "First Wall",
    "challengeDesc": "Choose the Fortress branch once. Fire can protect as easily as it destroys.",
    "condition": { "type": "choose_branch", "branch": "fortress" }
  },
  {
    "skillId": "io2",
    "name": "Pyromaniac",
    "challengeTitle": "Kill to Heal",
    "challengeDesc": "Survive 7 minutes as Ignara. You have to stay in the fire long enough to learn from it.",
    "condition": { "type": "survive_hero", "hero": "ignara", "minutes": 7 }
  },
  {
    "skillId": "io3",
    "name": "Molten Skin",
    "challengeTitle": "Pressure Makes Heat",
    "challengeDesc": "Kill 50 enemies while below 30% HP as Ignara across all runs. Pain focuses the flame.",
    "condition": { "type": "low_hp_kill", "hp_pct": 30, "count": 50 }
  },
  {
    "skillId": "io4",
    "name": "Ember Veil",
    "challengeTitle": "The Embers Stay",
    "challengeDesc": "Win 2 runs as Ignara. Surviving twice means the fire has chosen you back.",
    "condition": { "type": "win_hero_count", "hero": "ignara", "count": 2 }
  },
  {
    "skillId": "io5",
    "name": "Phoenix Heart",
    "challengeTitle": "She Cannot Die Yet",
    "challengeDesc": "Win a run as Ignara on the Undead map. Even among the dead, the flame refuses to go out.",
    "condition": { "type": "win_hero_map", "hero": "ignara", "map": "undead" }
  }
]
```

### Branch: Havoc (ih1–ih5)

*Theme: Chaotic aggression. Challenges involve speed, aggression, and risk-taking.*

```json
[
  {
    "skillId": "ih1",
    "name": "Backdraft",
    "challengeTitle": "Push Them Back",
    "challengeDesc": "Choose the Havoc branch once. Chaos has a direction — away from you.",
    "condition": { "type": "choose_branch", "branch": "havoc" }
  },
  {
    "skillId": "ih2",
    "name": "Eruption",
    "challengeTitle": "Volume of Fire",
    "challengeDesc": "Kill 150 enemies in a single run as Ignara. Explosions. More explosions.",
    "condition": { "type": "kills_run_hero", "hero": "ignara", "count": 150 }
  },
  {
    "skillId": "ih3",
    "name": "Lava Trail",
    "challengeTitle": "Burning Ground",
    "challengeDesc": "Complete 5 runs as Ignara. Each run leaves the earth a little more scorched.",
    "condition": { "type": "play_hero", "hero": "ignara", "count": 5 }
  },
  {
    "skillId": "ih4",
    "name": "Wildfire",
    "challengeTitle": "Chain Reaction",
    "challengeDesc": "Kill 30 enemies within 3 seconds in a single run. Fire teaches fire.",
    "condition": { "type": "multikill", "count": 30 }
  },
  {
    "skillId": "ih5",
    "name": "Meltdown",
    "challengeTitle": "Cornered Flame",
    "challengeDesc": "Win a run as Ignara after surviving below 20% HP for at least 30 seconds. The First Flame burns brightest when about to go out.",
    "condition": { "type": "win_hero_low_hp_duration", "hero": "ignara", "hp_pct": 20, "seconds": 30 }
  }
]
```

---

## Sifra — Ice/Lightning Mage

*The diplomat's daughter. She carries her mother's ice and the Rift's lightning in the same body.*

### Branch: Lightning (sl1–sl5)

*Theme: Chain reactions and overload. Challenges involve electricity and hitting multiple enemies.*

```json
[
  {
    "skillId": "sl1",
    "name": "Spark Initiate",
    "challengeTitle": "First Arc",
    "challengeDesc": "Choose the Lightning branch once in any run.",
    "condition": { "type": "choose_branch", "branch": "lightning" }
  },
  {
    "skillId": "sl2",
    "name": "Arc Reach",
    "challengeTitle": "Wider Current",
    "challengeDesc": "Kill 300 enemies as Sifra across all runs. The arc finds what it seeks.",
    "condition": { "type": "kills_hero", "hero": "sifra", "count": 300 }
  },
  {
    "skillId": "sl3",
    "name": "Overcharge",
    "challengeTitle": "Too Much Power",
    "challengeDesc": "Kill 120 enemies in a single run as Sifra in Lightning stance. Push the current past its limit.",
    "condition": { "type": "kills_run_hero_stance", "hero": "sifra", "stance": "lightning", "count": 120 }
  },
  {
    "skillId": "sl4",
    "name": "Ball Lightning",
    "challengeTitle": "Living Thunder",
    "challengeDesc": "Win a run as Sifra. The storm inside her finally answers back.",
    "condition": { "type": "win_hero", "hero": "sifra" }
  },
  {
    "skillId": "sl5",
    "name": "Storm Lord",
    "challengeTitle": "The Sky Remembers Her Parents",
    "challengeDesc": "Win a run as Sifra on the Grasslands map with the Lightning branch maxed. Open sky. Full storm.",
    "condition": { "type": "win_hero_map_max_branch", "hero": "sifra", "map": "grasslands", "branch": "lightning" }
  }
]
```

### Branch: Frost (sf1–sf5)

*Theme: Patience and crowd control. Challenges involve slowing, surviving, and methodical play.*

```json
[
  {
    "skillId": "sf1",
    "name": "Deep Freeze",
    "challengeTitle": "Cold Patience",
    "challengeDesc": "Choose the Frost branch once. Ice is not hurry.",
    "condition": { "type": "choose_branch", "branch": "frost" }
  },
  {
    "skillId": "sf2",
    "name": "Blizzard Aura",
    "challengeTitle": "Slow the Swarm",
    "challengeDesc": "Survive 6 minutes as Sifra in Ice stance. The aura grows with stillness.",
    "condition": { "type": "survive_hero_stance", "hero": "sifra", "stance": "ice", "minutes": 6 }
  },
  {
    "skillId": "sf3",
    "name": "Frost Nova",
    "challengeTitle": "Eruption of Cold",
    "challengeDesc": "Kill 10 enemies within 3 seconds as Sifra. Ice can be explosive.",
    "condition": { "type": "multikill_hero", "hero": "sifra", "count": 10 }
  },
  {
    "skillId": "sf4",
    "name": "Absolute Zero",
    "challengeTitle": "Stop Everything",
    "challengeDesc": "Win a run as Sifra using Ice stance only. Absolute control demands absolute commitment.",
    "condition": { "type": "win_hero_stance_only", "hero": "sifra", "stance": "ice" }
  },
  {
    "skillId": "sf5",
    "name": "Eternal Winter",
    "challengeTitle": "The Cold That Never Leaves",
    "challengeDesc": "Win 3 runs as Sifra. She was born in the North. This is natural to her now.",
    "condition": { "type": "win_hero_count", "hero": "sifra", "count": 3 }
  }
]
```

### Branch: Shatter (ss1–ss5)

*Theme: Multiplication and amplification. Challenges involve high kill counts and combo play.*

```json
[
  {
    "skillId": "ss1",
    "name": "Permafrost",
    "challengeTitle": "Exploit the Chill",
    "challengeDesc": "Choose the Shatter branch once. Cold enemies break differently.",
    "condition": { "type": "choose_branch", "branch": "shatter" }
  },
  {
    "skillId": "ss2",
    "name": "Shatter",
    "challengeTitle": "Break Them Apart",
    "challengeDesc": "Kill 200 enemies as Sifra using Ice shards across all runs.",
    "condition": { "type": "kills_hero", "hero": "sifra", "count": 200 }
  },
  {
    "skillId": "ss3",
    "name": "Ice Spear",
    "challengeTitle": "Through and Through",
    "challengeDesc": "Reach level 12 in a single run as Sifra. Depth of knowledge before reach of power.",
    "condition": { "type": "reach_level_hero", "hero": "sifra", "level": 12 }
  },
  {
    "skillId": "ss4",
    "name": "Frostbite",
    "challengeTitle": "The Shards Multiply",
    "challengeDesc": "Kill 180 enemies in a single run as Sifra. Every shard becomes three.",
    "condition": { "type": "kills_run_hero", "hero": "sifra", "count": 180 }
  },
  {
    "skillId": "ss5",
    "name": "Avalanche",
    "challengeTitle": "Inevitable",
    "challengeDesc": "Win a run as Sifra with the Shatter branch maxed. The mountain does not stop.",
    "condition": { "type": "win_hero_max_branch", "hero": "sifra", "branch": "shatter" }
  }
]
```

### Branch: Crystal (sc1–sc5)

*Theme: Defense and reflection. Challenges involve surviving, protecting, and enduring hits.*

```json
[
  {
    "skillId": "sc1",
    "name": "Wide Shard",
    "challengeTitle": "Broader Front",
    "challengeDesc": "Choose the Crystal branch once. Ice can be a wall or a weapon.",
    "condition": { "type": "choose_branch", "branch": "crystal_sifra" }
  },
  {
    "skillId": "sc2",
    "name": "Ice Armor",
    "challengeTitle": "Frosted Shell",
    "challengeDesc": "Survive 5 minutes as Sifra without dying in 5 separate runs. Patience builds the shell.",
    "condition": { "type": "survive_hero_runs", "hero": "sifra", "minutes": 5, "count": 5 }
  },
  {
    "skillId": "sc3",
    "name": "Mirror Ice",
    "challengeTitle": "Reflect, Pierce, Reflect",
    "challengeDesc": "Play 4 runs as Sifra. The crystal learns the angles.",
    "condition": { "type": "play_hero", "hero": "sifra", "count": 4 }
  },
  {
    "skillId": "sc4",
    "name": "Cryo Shield",
    "challengeTitle": "Strike When Struck",
    "challengeDesc": "Kill 40 enemies while below 40% HP as Sifra across all runs. The cold hardens under pressure.",
    "condition": { "type": "low_hp_kill_hero", "hero": "sifra", "hp_pct": 40, "count": 40 }
  },
  {
    "skillId": "sc5",
    "name": "Diamond Dust",
    "challengeTitle": "Sharpest Ice",
    "challengeDesc": "Win a run as Sifra on the Undead map. Cold outlasts death.",
    "condition": { "type": "win_hero_map", "hero": "sifra", "map": "undead" }
  }
]
```

---

## Amun — Guardian

*A living artifact. He has been walking since before anyone alive was born. He remembers the dead of Amunat by name.*

### Branch: Wrath (aw1–aw5)

*Theme: Divine punishment and auras. Challenges involve being hit, surviving, and battlefield presence.*

```json
[
  {
    "skillId": "aw1",
    "name": "Thorns",
    "challengeTitle": "Give It Back",
    "challengeDesc": "Choose the Wrath branch once. Amun does not forgive strikes lightly.",
    "condition": { "type": "choose_branch", "branch": "wrath" }
  },
  {
    "skillId": "aw2",
    "name": "Wrath",
    "challengeTitle": "Ancient Anger",
    "challengeDesc": "Kill 300 enemies as Amun across all runs. One thousand years of patience, ending.",
    "condition": { "type": "kills_hero", "hero": "amun", "count": 300 }
  },
  {
    "skillId": "aw3",
    "name": "Consecration",
    "challengeTitle": "Holy Ground",
    "challengeDesc": "Survive 8 minutes as Amun in a single run. The aura needs time to saturate the earth.",
    "condition": { "type": "survive_hero", "hero": "amun", "minutes": 8 }
  },
  {
    "skillId": "aw4",
    "name": "Living Fortress",
    "challengeTitle": "The Wall That Breathes",
    "challengeDesc": "Win a run as Amun. He does not fall. He has never fallen. He will not fall today.",
    "condition": { "type": "win_hero", "hero": "amun" }
  },
  {
    "skillId": "aw5",
    "name": "Divine Judgment",
    "challengeTitle": "Pharaoh's Decree",
    "challengeDesc": "Win a run as Amun after having also won a run as Ignara. The fire taught him wrath. The earth remembers.",
    "condition": { "type": "hero_then_hero", "first": "ignara", "then": "amun" }
  }
]
```

### Branch: Bastion (ab1–ab5)

*Theme: Unyielding defense. Challenges involve tanking, surviving near death, and outlasting.*

```json
[
  {
    "skillId": "ab1",
    "name": "Fortify",
    "challengeTitle": "The First Wall",
    "challengeDesc": "Choose the Bastion branch once. Stone does not choose to stand. It simply does.",
    "condition": { "type": "choose_branch", "branch": "bastion" }
  },
  {
    "skillId": "ab2",
    "name": "Aura of Might",
    "challengeTitle": "Presence",
    "challengeDesc": "Complete 5 runs as Amun. He has stood in worse places for longer.",
    "condition": { "type": "play_hero", "hero": "amun", "count": 5 }
  },
  {
    "skillId": "ab3",
    "name": "Iron Will",
    "challengeTitle": "The Hit That Could Not Kill",
    "challengeDesc": "Kill 60 enemies while below 20% HP as Amun across all runs. The limit exists. He ignores it.",
    "condition": { "type": "low_hp_kill_hero", "hero": "amun", "hp_pct": 20, "count": 60 }
  },
  {
    "skillId": "ab4",
    "name": "Regenerate",
    "challengeTitle": "Stone Heals Slowly",
    "challengeDesc": "Survive 9 minutes as Amun in a single run. Most of healing is simply waiting.",
    "condition": { "type": "survive_hero", "hero": "amun", "minutes": 9 }
  },
  {
    "skillId": "ab5",
    "name": "Undying",
    "challengeTitle": "Not Yet. Not Ever.",
    "challengeDesc": "Win 3 runs as Amun. The Ankh he carries is not a symbol. It is a fact.",
    "condition": { "type": "win_hero_count", "hero": "amun", "count": 3 }
  }
]
```

### Branch: Quake (aq1–aq5)

*Theme: Ground control, mass knockback, seismic power. Challenges involve crowd control and density.*

```json
[
  {
    "skillId": "aq1",
    "name": "Titan's Pulse",
    "challengeTitle": "Wake the Ground",
    "challengeDesc": "Choose the Quake branch once. The earth waits for him to speak.",
    "condition": { "type": "choose_branch", "branch": "quake" }
  },
  {
    "skillId": "aq2",
    "name": "Earthquake",
    "challengeTitle": "Everything Falls",
    "challengeDesc": "Kill 20 enemies within 3 seconds as Amun. When the ground moves, nothing stands.",
    "condition": { "type": "multikill_hero", "hero": "amun", "count": 20 }
  },
  {
    "skillId": "aq3",
    "name": "Colossus",
    "challengeTitle": "The Push That Ends Arguments",
    "challengeDesc": "Kill 400 enemies as Amun across all runs. He has moved things before. Mountains, armies, gods.",
    "condition": { "type": "kills_hero", "hero": "amun", "count": 400 }
  },
  {
    "skillId": "aq4",
    "name": "Gravity Well",
    "challengeTitle": "Come Here",
    "challengeDesc": "Reach level 14 in a single run as Amun. Gravity deepens with experience.",
    "condition": { "type": "reach_level_hero", "hero": "amun", "level": 14 }
  },
  {
    "skillId": "aq5",
    "name": "Cataclysm",
    "challengeTitle": "Two Quakes. No Survivors.",
    "challengeDesc": "Win a run as Amun with the Quake branch maxed. The second wave always finishes what the first began.",
    "condition": { "type": "win_hero_max_branch", "hero": "amun", "branch": "quake" }
  }
]
```

---

## Nazar — Samurai/Assassin

*Hired to kill a cult. The cult killed his employer. He stayed because leaving felt like losing.*

### Branch: Way of the Blade (nb1–nb5)

*Theme: Precise lethality. Challenges involve melee kills, burst damage, and solitary combat.*

```json
[
  {
    "skillId": "nb1",
    "name": "Shadow Step",
    "challengeTitle": "First Shadow",
    "challengeDesc": "Choose the Way of the Blade once. Every assassin's first lesson: close the distance.",
    "condition": { "type": "choose_branch", "branch": "blade" }
  },
  {
    "skillId": "nb2",
    "name": "Twin Blades",
    "challengeTitle": "Second Strike",
    "challengeDesc": "Kill 150 enemies as Nazar across all runs. Two cuts are faster than one.",
    "condition": { "type": "kills_hero", "hero": "nazar", "count": 150 }
  },
  {
    "skillId": "nb3",
    "name": "Blade Surge",
    "challengeTitle": "Full Commitment",
    "challengeDesc": "Kill 100 enemies in a single run as Nazar. Hesitation costs distance.",
    "condition": { "type": "kills_run_hero", "hero": "nazar", "count": 100 }
  },
  {
    "skillId": "nb4",
    "name": "Hemorrhage",
    "challengeTitle": "They Bleed Slow",
    "challengeDesc": "Survive 7 minutes as Nazar. His targets rarely know they're dead until it's over.",
    "condition": { "type": "survive_hero", "hero": "nazar", "minutes": 7 }
  },
  {
    "skillId": "nb5",
    "name": "Assassinate",
    "challengeTitle": "One Target. One Cut.",
    "challengeDesc": "Win a run as Nazar without taking damage for 30 consecutive seconds during any point in the run. A true assassin is never where the blade lands.",
    "condition": { "type": "no_damage_duration_hero", "hero": "nazar", "seconds": 30 }
  }
]
```

### Branch: Way of Venom (nv1–nv5)

*Theme: Plague and patience. Challenges involve DoT kills, spreading effects, and long survival.*

```json
[
  {
    "skillId": "nv1",
    "name": "Toxic Slash",
    "challengeTitle": "First Poison",
    "challengeDesc": "Choose the Way of Venom once. The poison does the waiting for you.",
    "condition": { "type": "choose_branch", "branch": "venom" }
  },
  {
    "skillId": "nv2",
    "name": "Virulent Strain",
    "challengeTitle": "Spread It",
    "challengeDesc": "Kill 250 enemies as Nazar across all runs. Enough bodies to learn what the toxin prefers.",
    "condition": { "type": "kills_hero", "hero": "nazar", "count": 250 }
  },
  {
    "skillId": "nv3",
    "name": "Pandemic",
    "challengeTitle": "No Cure",
    "challengeDesc": "Kill 120 enemies in a single run as Nazar. Every death seeds the next.",
    "condition": { "type": "kills_run_hero", "hero": "nazar", "count": 120 }
  },
  {
    "skillId": "nv4",
    "name": "Weakness",
    "challengeTitle": "Make Them Soft",
    "challengeDesc": "Win a run as Nazar on the Undead map. Even the dead rot faster when poisoned.",
    "condition": { "type": "win_hero_map", "hero": "nazar", "map": "undead" }
  },
  {
    "skillId": "nv5",
    "name": "Necrosis",
    "challengeTitle": "The Rot That Eats Itself",
    "challengeDesc": "Win a run as Nazar with the Venom branch maxed. Necrosis doesn't stop until there's nothing left to consume.",
    "condition": { "type": "win_hero_max_branch", "hero": "nazar", "branch": "venom" }
  }
]
```

### Branch: Way of Shadow (ns1–ns5)

*Theme: Invulnerability and execution. Challenges involve staying unseen, surviving perfectly, and kill conditions.*

```json
[
  {
    "skillId": "ns1",
    "name": "Vanish",
    "challengeTitle": "First Disappearance",
    "challengeDesc": "Choose the Way of Shadow once. The shadow is not a place. It is a decision.",
    "condition": { "type": "choose_branch", "branch": "shadow" }
  },
  {
    "skillId": "ns2",
    "name": "Phantom Trail",
    "challengeTitle": "Afterimage",
    "challengeDesc": "Survive 5 minutes as Nazar without dying across 5 separate runs. The trail is only visible after he's already gone.",
    "condition": { "type": "survive_hero_runs", "hero": "nazar", "minutes": 5, "count": 5 }
  },
  {
    "skillId": "ns3",
    "name": "Smoke Bomb",
    "challengeTitle": "Cloud Cover",
    "challengeDesc": "Complete 4 runs as Nazar. The smoke comes naturally to those who've practiced disappearing.",
    "condition": { "type": "play_hero", "hero": "nazar", "count": 4 }
  },
  {
    "skillId": "ns4",
    "name": "Blood Scent",
    "challengeTitle": "Find the Weak",
    "challengeDesc": "Kill 50 enemies while below 30% HP as Nazar across all runs. Blood in the air — his or theirs. He works either way.",
    "condition": { "type": "low_hp_kill_hero", "hero": "nazar", "hp_pct": 30, "count": 50 }
  },
  {
    "skillId": "ns5",
    "name": "Death Mark",
    "challengeTitle": "They Were Already Dead",
    "challengeDesc": "Win a run as Nazar after having also won runs as both Ignara and Sifra. He watched them fight. He learned what a death mark really means.",
    "condition": { "type": "multi_hero_wins_then", "prereqs": ["ignara", "sifra"], "then": "nazar" }
  }
]
```

---

## Lyra — Huntress (Spear Thrower)

*First hunter to return from the Great Hunt twice. After the third time, she stopped returning. The Rift is more alive than anywhere she's been.*

### Branch: Predator (hp1–hp5)

*Theme: Crits, kill streaks, hunter's instinct. Challenges involve fast kills and high aggression.*

```json
[
  {
    "skillId": "hp1",
    "name": "Critical Strike",
    "challengeTitle": "Lucky Shot",
    "challengeDesc": "Choose the Predator branch once. The first critical hit is always surprising.",
    "condition": { "type": "choose_branch", "branch": "predator" }
  },
  {
    "skillId": "hp2",
    "name": "Marked Target",
    "challengeTitle": "Pick One",
    "challengeDesc": "Kill 200 enemies as Lyra across all runs. A hunter learns to choose her target first.",
    "condition": { "type": "kills_hero", "hero": "huntress", "count": 200 }
  },
  {
    "skillId": "hp3",
    "name": "Battle Frenzy",
    "challengeTitle": "Kill Streak",
    "challengeDesc": "Kill 130 enemies in a single run as Lyra. The frenzy starts on the second kill.",
    "condition": { "type": "kills_run_hero", "hero": "huntress", "count": 130 }
  },
  {
    "skillId": "hp4",
    "name": "Headhunter",
    "challengeTitle": "Collect the Trophy",
    "challengeDesc": "Win a run as Lyra. The Great Hunt ends when there's nothing left to chase.",
    "condition": { "type": "win_hero", "hero": "huntress" }
  },
  {
    "skillId": "hp5",
    "name": "Volley",
    "challengeTitle": "All at Once",
    "challengeDesc": "Win a run as Lyra with the Predator branch maxed. Every fifth spear is a declaration.",
    "condition": { "type": "win_hero_max_branch", "hero": "huntress", "branch": "predator" }
  }
]
```

### Branch: Stalker (hs1–hs5)

*Theme: Movement, traps, evasion. Challenges involve kiting, speed, and avoiding damage.*

```json
[
  {
    "skillId": "hs1",
    "name": "Kill Stride",
    "challengeTitle": "Keep Running",
    "challengeDesc": "Choose the Stalker branch once. The Stalker never stops moving.",
    "condition": { "type": "choose_branch", "branch": "stalker" }
  },
  {
    "skillId": "hs2",
    "name": "Caltrops",
    "challengeTitle": "Leave a Surprise",
    "challengeDesc": "Survive 6 minutes as Lyra. The traps only work if you're still moving when they trigger.",
    "condition": { "type": "survive_hero", "hero": "huntress", "minutes": 6 }
  },
  {
    "skillId": "hs3",
    "name": "Net Throw",
    "challengeTitle": "Hold Still",
    "challengeDesc": "Kill 300 enemies as Lyra across all runs. Every eighth spear earns the net.",
    "condition": { "type": "kills_hero", "hero": "huntress", "count": 300 }
  },
  {
    "skillId": "hs4",
    "name": "Camouflage",
    "challengeTitle": "Now You Don't",
    "challengeDesc": "Kill 40 enemies without taking damage for 20 consecutive seconds as Lyra across all runs. You can't see her if she doesn't want you to.",
    "condition": { "type": "kills_no_damage_hero", "hero": "huntress", "seconds": 20, "count": 40 }
  },
  {
    "skillId": "hs5",
    "name": "Leap",
    "challengeTitle": "Never Cornered",
    "challengeDesc": "Win a run as Lyra after having also won a run as Khashin. Wind taught her how to leave a space in a hurry.",
    "condition": { "type": "hero_then_hero", "first": "khashin", "then": "huntress" }
  }
]
```

### Branch: Warden (hw1–hw5)

*Theme: Spear mastery, AoE, field dominance. Challenges involve multi-pierce, mass kills, and battlefield control.*

```json
[
  {
    "skillId": "hw1",
    "name": "Spear Mastery",
    "challengeTitle": "Through One, Into Another",
    "challengeDesc": "Choose the Warden branch once. The spear's purpose is to keep going.",
    "condition": { "type": "choose_branch", "branch": "warden" }
  },
  {
    "skillId": "hw2",
    "name": "Explosive Tips",
    "challengeTitle": "Point of Impact",
    "challengeDesc": "Kill 160 enemies in a single run as Lyra. The tip decides everything.",
    "condition": { "type": "kills_run_hero", "hero": "huntress", "count": 160 }
  },
  {
    "skillId": "hw3",
    "name": "Splinter Shot",
    "challengeTitle": "Nothing Goes to Waste",
    "challengeDesc": "Kill 400 enemies as Lyra across all runs. Even a missed spear becomes three shards.",
    "condition": { "type": "kills_hero", "hero": "huntress", "count": 400 }
  },
  {
    "skillId": "hw4",
    "name": "Spear Wall",
    "challengeTitle": "The Rotating Defense",
    "challengeDesc": "Survive 8 minutes as Lyra in a single run. The orbiting spears need time to find their rhythm.",
    "condition": { "type": "survive_hero", "hero": "huntress", "minutes": 8 }
  },
  {
    "skillId": "hw5",
    "name": "Earth Slam",
    "challengeTitle": "She Learned From the Ground",
    "challengeDesc": "Win a run as Lyra on the Grasslands map with the Warden branch maxed. The earth speaks differently to those who listen with a spear.",
    "condition": { "type": "win_hero_map_max_branch", "hero": "huntress", "map": "grasslands", "branch": "warden" }
  }
]
```

---

## Khashin — Wind Elemental

*No origin the desert remembers. He moves because stopping is impossible. The wind inside him has an appetite.*

### Branch: Gale (kw1–kw5)

*Theme: Speed, piercing arcs, tornado generation. Challenges involve high-speed kills and moving constantly.*

```json
[
  {
    "skillId": "kw1",
    "name": "Razor Wind",
    "challengeTitle": "First Blade of Air",
    "challengeDesc": "Choose the Gale branch once. The wind was already cutting. Now it is aware of what it cuts.",
    "condition": { "type": "choose_branch", "branch": "gale" }
  },
  {
    "skillId": "kw2",
    "name": "Gust Strike",
    "challengeTitle": "Push the Tide",
    "challengeDesc": "Kill 200 enemies as Khashin across all runs. The gust finds its strength in repetition.",
    "condition": { "type": "kills_hero", "hero": "khashin", "count": 200 }
  },
  {
    "skillId": "kw3",
    "name": "Dust Devil",
    "challengeTitle": "Leave a Tornado, Keep Moving",
    "challengeDesc": "Kill 110 enemies in a single run as Khashin in Sirocco stance. The devil drifts. You are already elsewhere.",
    "condition": { "type": "kills_run_hero_stance", "hero": "khashin", "stance": "sirocco", "count": 110 }
  },
  {
    "skillId": "kw4",
    "name": "Cyclone Surge",
    "challengeTitle": "Grow the Storm",
    "challengeDesc": "Win a run as Khashin. The storm does not shrink. It has never shrunk. It grows.",
    "condition": { "type": "win_hero", "hero": "khashin" }
  },
  {
    "skillId": "kw5",
    "name": "Eye of the Storm",
    "challengeTitle": "The Center That Does Not Move",
    "challengeDesc": "Win a run as Khashin with the Gale branch maxed. Only at the center of the storm is there quiet.",
    "condition": { "type": "win_hero_max_branch", "hero": "khashin", "branch": "gale" }
  }
]
```

### Branch: Dune (kd1–kd5)

*Theme: Blindness and amplification. Challenges involve Haboob stance, debuff synergy, and patience.*

```json
[
  {
    "skillId": "kd1",
    "name": "Choking Sand",
    "challengeTitle": "Dust in the Eyes",
    "challengeDesc": "Choose the Dune branch once. Blinded enemies fight shadows. Khashin is not a shadow.",
    "condition": { "type": "choose_branch", "branch": "dune" }
  },
  {
    "skillId": "kd2",
    "name": "Sand Armor",
    "challengeTitle": "The Desert's Shield",
    "challengeDesc": "Survive 6 minutes as Khashin in Haboob stance. The sand coats him if he stays in it long enough.",
    "condition": { "type": "survive_hero_stance", "hero": "khashin", "stance": "haboob", "minutes": 6 }
  },
  {
    "skillId": "kd3",
    "name": "Abrasion",
    "challengeTitle": "Sand Takes Everything",
    "challengeDesc": "Kill 350 enemies as Khashin across all runs. Abrasion is not a technique. It is time.",
    "condition": { "type": "kills_hero", "hero": "khashin", "count": 350 }
  },
  {
    "skillId": "kd4",
    "name": "Scarab Tide",
    "challengeTitle": "After the Kill, the Beetles",
    "challengeDesc": "Kill 120 enemies in a single run as Khashin in Haboob stance. Every kill sends the scarabs to the next target.",
    "condition": { "type": "kills_run_hero_stance", "hero": "khashin", "stance": "haboob", "count": 120 }
  },
  {
    "skillId": "kd5",
    "name": "Sandstorm Wall",
    "challengeTitle": "The Wall That Moves With Him",
    "challengeDesc": "Win a run as Khashin on the Grasslands map with the Dune branch maxed. Even green places can fill with sand.",
    "condition": { "type": "win_hero_map_max_branch", "hero": "khashin", "map": "grasslands", "branch": "dune" }
  }
]
```

### Branch: Mirage (km1–km5)

*Theme: Evasion, deception, impossible-to-catch. Challenges involve surviving without being hit and high-speed play.*

```json
[
  {
    "skillId": "km1",
    "name": "Tailwind",
    "challengeTitle": "Faster First",
    "challengeDesc": "Choose the Mirage branch once. Every other trick is built on speed.",
    "condition": { "type": "choose_branch", "branch": "mirage" }
  },
  {
    "skillId": "km2",
    "name": "Phantom Step",
    "challengeTitle": "He Was Here",
    "challengeDesc": "Complete 4 runs as Khashin. The auto-dash comes naturally to those who understand how often they almost die.",
    "condition": { "type": "play_hero", "hero": "khashin", "count": 4 }
  },
  {
    "skillId": "km3",
    "name": "Mirage",
    "challengeTitle": "Which One Is Real",
    "challengeDesc": "Kill 30 enemies without taking damage for 20 consecutive seconds as Khashin across all runs. The decoy needs to be believable.",
    "condition": { "type": "kills_no_damage_hero", "hero": "khashin", "seconds": 20, "count": 30 }
  },
  {
    "skillId": "km4",
    "name": "Drift",
    "challengeTitle": "The Path That Slows Them",
    "challengeDesc": "Survive 8 minutes as Khashin in a single run. Drift long enough and the trail covers everything.",
    "condition": { "type": "survive_hero", "hero": "khashin", "minutes": 8 }
  },
  {
    "skillId": "km5",
    "name": "Desert Wind",
    "challengeTitle": "He Was Never There",
    "challengeDesc": "Win a run as Khashin without dying, taking fewer than 5 hits during the boss fight. He does not fight the boss. He simply isn't where it strikes.",
    "condition": { "type": "win_hero_boss_evasion", "hero": "khashin", "max_boss_hits": 5 }
  }
]
```

---

## Crystal Muller — Gnome Crystal Slammer

*She came above ground to find what's destabilizing the deep mines. She calls it a geological problem. Everyone else calls it evil.*

### Branch: Shardfall (cm1–cm5)

*Theme: Bigger, wider, more destructive crystal waves. Challenges involve high damage and wide sweeps.*

```json
[
  {
    "skillId": "cm1",
    "name": "Coarse Cut",
    "challengeTitle": "Find the Grain",
    "challengeDesc": "Choose the Shardfall branch once. She studies the angle before she swings.",
    "condition": { "type": "choose_branch", "branch": "shardfall" }
  },
  {
    "skillId": "cm2",
    "name": "Deep Vein",
    "challengeTitle": "Reach Farther",
    "challengeDesc": "Kill 200 enemies as Muller across all runs. The best ore is always deeper.",
    "condition": { "type": "kills_hero", "hero": "muller", "count": 200 }
  },
  {
    "skillId": "cm3",
    "name": "Shardstorm",
    "challengeTitle": "Double Wave",
    "challengeDesc": "Kill 140 enemies in a single run as Muller. The second wave finishes what the first misses.",
    "condition": { "type": "kills_run_hero", "hero": "muller", "count": 140 }
  },
  {
    "skillId": "cm4",
    "name": "Crystal Shrapnel",
    "challengeTitle": "The Shard Dies Last",
    "challengeDesc": "Win a run as Muller. Every crystal that shatters becomes shrapnel. Nothing is wasted.",
    "condition": { "type": "win_hero", "hero": "muller" }
  },
  {
    "skillId": "cm5",
    "name": "Tectonic Fury",
    "challengeTitle": "Every Fifth Hit Is the Earth Speaking",
    "challengeDesc": "Win a run as Muller with the Shardfall branch maxed. She does not choose when the earth speaks. She just keeps hitting until it does.",
    "condition": { "type": "win_hero_max_branch", "hero": "muller", "branch": "shardfall" }
  }
]
```

### Branch: Geode Shell (cr1–cr5)

*Theme: Crystal defense and armor. Challenges involve survival, tanking hits, and enduring under pressure.*

```json
[
  {
    "skillId": "cr1",
    "name": "Stone Skin",
    "challengeTitle": "Kill to Harden",
    "challengeDesc": "Choose the Geode Shell branch once. Every kill deposits something. It adds up.",
    "condition": { "type": "choose_branch", "branch": "geode" }
  },
  {
    "skillId": "cr2",
    "name": "Geode Shell",
    "challengeTitle": "Something to Break First",
    "challengeDesc": "Survive 7 minutes as Muller in a single run. The shell needs time to form properly.",
    "condition": { "type": "survive_hero", "hero": "muller", "minutes": 7 }
  },
  {
    "skillId": "cr3",
    "name": "Crystal Wall",
    "challengeTitle": "Temporary Terrain",
    "challengeDesc": "Kill 300 enemies as Muller across all runs. Each slam teaches the crystal what needs blocking.",
    "condition": { "type": "kills_hero", "hero": "muller", "count": 300 }
  },
  {
    "skillId": "cr4",
    "name": "Resonance Armor",
    "challengeTitle": "The Wave Comes Back",
    "challengeDesc": "Kill 60 enemies while below 40% HP as Muller across all runs. The crystal shell responds fastest when things get bad.",
    "condition": { "type": "low_hp_kill_hero", "hero": "muller", "hp_pct": 40, "count": 60 }
  },
  {
    "skillId": "cr5",
    "name": "Living Geode",
    "challengeTitle": "She Has Become the Rock",
    "challengeDesc": "Win 3 runs as Muller. After three times, the crystals growing on her skin are permanent. She stopped minding.",
    "condition": { "type": "win_hero_count", "hero": "muller", "count": 3 }
  }
]
```

### Branch: Deep Seam (cf1–cf5)

*Theme: Battlefield minefield and field control. Challenges involve strategic play, map control, and placed structures.*

```json
[
  {
    "skillId": "cf1",
    "name": "Planted Shard",
    "challengeTitle": "Seed the Field",
    "challengeDesc": "Choose the Deep Seam branch once. A good miner plants before she harvests.",
    "condition": { "type": "choose_branch", "branch": "deep_seam" }
  },
  {
    "skillId": "cf2",
    "name": "Crystal Pillar",
    "challengeTitle": "Something Permanent",
    "challengeDesc": "Complete 5 runs as Muller. The pillar takes time to understand where to erupt.",
    "condition": { "type": "play_hero", "hero": "muller", "count": 5 }
  },
  {
    "skillId": "cf3",
    "name": "Fault Line",
    "challengeTitle": "Carve the Ground",
    "challengeDesc": "Survive 8 minutes as Muller in a single run. Fault lines take depth and time.",
    "condition": { "type": "survive_hero", "hero": "muller", "minutes": 8 }
  },
  {
    "skillId": "cf4",
    "name": "Resonance Field",
    "challengeTitle": "Everything Hums Here",
    "challengeDesc": "Win a run as Muller on the Undead map. The dead don't move so well when the crystal field is active.",
    "condition": { "type": "win_hero_map", "hero": "muller", "map": "undead" }
  },
  {
    "skillId": "cf5",
    "name": "The Mother Lode",
    "challengeTitle": "One Shot. Everything.",
    "challengeDesc": "Win a run as Muller after having also won a run as Amun. She met someone else who understands ground. They disagreed on technique. She remembered the disagreement.",
    "condition": { "type": "hero_then_hero", "first": "amun", "then": "muller" }
  }
]
```

---

## Implementation Notes

### Data Shape — localStorage Extension

Add two new keys to `MetaData` (in `MetaProgress.ts`):

```typescript
interface MetaData {
  // ... existing fields ...
  skillUnlocks: string[]           // array of skillId strings that are unlocked
  challengeProgress: Record<string, number>  // skillId -> progress count
}
```

Default: `skillUnlocks = []`, `challengeProgress = {}`

When `UNLOCK_ALL` is `false` (production), the upgrade panel filters available skills through `meta.skillUnlocks`.

### Progress Tracking — What Needs Instrumentation

The following new fields need to be tracked **per-session** and **accumulated** in MetaData:

| Need | Where to Track | Note |
|------|---------------|------|
| `kills_with_stance` | GameScene, on enemy death | Track active stance at kill time |
| `kills_run_hero` | Existing `session.kills` + `session.hero` | Already available |
| `low_hp_kill` | GameScene, on enemy death when player HP < threshold | New flag |
| `no_damage_duration` | GameScene timer per player | Reset on any damage event |
| `boss_hits_taken` | Boss fight phase tracker | Count player hits during boss window |
| `kills_no_damage_streak` | GameScene, rolling window | Kill count inside N-second no-hit window |
| `multikill` | GameScene, rolling 3s kill counter | Already useful for achievement `speed_kill` |
| `branch_maxed` | Existing `session.upgrades` | Already available, parse prefix |
| `map_played` | Add `map: string` to `SessionRecord` | New field, set in GameScene on start |
| `stance_only_run` | GameScene, track if non-primary stance ever used | New flag |

### Session Record Extension

```typescript
interface SessionRecord {
  // ... existing fields ...
  map: string              // 'grasslands' | 'undead'
  branch: string           // which branch was chosen at level-up
  maxLowHpKills: number    // kills while below 30% HP this run
  maxNoDamageDuration: number  // longest consecutive no-damage streak (ms)
  bossHitsTaken: number    // hits taken during boss fight
  stancesUsed: string[]    // which stances were used this run
}
```

### Challenge Check Architecture

```typescript
// New file: src/systems/ChallengeSystem.ts
export class ChallengeSystem {
  static checkChallenges(session: SessionRecord): string[] // returns newly unlocked skillIds
  static isSkillUnlocked(skillId: string): boolean
  static getChallengeProgress(skillId: string): { current: number, target: number }
}
```

Called from the same point as `MetaProgress.checkAchievements()` — at run end, before the results screen.

### Condition Evaluation Priority

1. **Instant conditions** (choose_branch, play_any): check on session end, no accumulation needed
2. **Accumulated conditions** (kills_hero, kills_total): stored in `challengeProgress[skillId]`, incremented each session
3. **In-session conditions** (kills_run, survive_minutes, low_hp_kill): check only from the current session record
4. **Compound conditions** (hero_then_hero, win_hero_max_branch): check using full `MetaData` state

### Migration

Players with `UNLOCK_ALL = true` data should have all skills pre-populated in `skillUnlocks` when the system goes live, so existing players don't lose access. A migration flag `challengeSystemVersion: 1` in MetaData handles this — if absent, populate all skills as unlocked.

### UI Considerations

- Locked skills in the Encyclopedia: show skill name and challenge description, no stats
- Locked skills in the upgrade panel: simply do not appear (don't show locked skills mid-run)
- Challenge progress visible on the skill card: "214 / 300 Ignara kills" as a small progress bar
- Challenge completion toast: appears on the results screen, not mid-run (avoid disrupting gameplay)

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Generic skills | 10 |
| Ignara branches × 5 | 15 |
| Sifra branches × 5 (4 branches) | 20 |
| Amun branches × 5 | 15 |
| Nazar branches × 5 | 15 |
| Lyra branches × 5 | 15 |
| Khashin branches × 5 | 15 |
| Crystal Muller branches × 5 | 15 |
| **Total** | **120** |

Note: Sifra has 4 branches (Lightning, Frost, Shatter, Crystal) rather than 3, contributing 20 challenges instead of 15. This matches her dual-stance gating system.

Cross-hero challenges (challenges that require playing multiple heroes): `aw5`, `ns5`, `hs5`, `cf5` — these create narrative threads between heroes that hint at the shared world.

Map-specific challenges: `io5`, `nv4`, `sc5`, `kd5`, `hw5`, `cr4` — these motivate players to try both Grasslands and Undead.
