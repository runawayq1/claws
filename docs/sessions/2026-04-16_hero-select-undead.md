# Session Log — 2026-04-16/17

## Hero Select Popup (v0.5.1)
- Full popup overhaul: 2-column layout (portrait+stats left, stance cards right)
- Gold frame with animated tracer, ambient particles per hero, attack anim on stance select
- Stance pre-selection: first level-up skips branch picker, starts with chosen skill applied
- Hero cycling: arrow buttons, keyboard Left/Right, mobile swipe
- Per-hero stats block (RUNS/KILLS/TIME from MetaProgress aggregates)
- Staggered entry animation, close animation, shine sweep, icon pulse, button press depth
- prefers-reduced-motion respected

## Scene Overhaul
- Hero grid: 5-col landscape / 3-col portrait with gold halos, idle breathe, accent stripes
- CircleButton component deployed to all scenes (back/logout buttons)
- StartScene: pill-style bottom buttons, mode button gold ring hover
- ForgeScene: card glow + press depth, section divider, mobile 3-col
- LeaderboardScene: alternating rows, gold header, softer W/L colors
- ProfileScene: achievement medals (gold/dark circles), category dots
- NotificationBell: gold badge, halo pulse

## Premium UI Wave
- LevelUpScene: gold bevel borders, branch-color gradient, icon glow, card flip shine sweep + icon bounce-in, entry scale animation
- Glass HP/energy bars: semi-transparent bg, gold border, HP shimmer on damage
- Cinematic end screen: overlay fade 800ms, title scale, stats cascade, button stagger

## Tailwind Color Palette
- All 9 heroes + 27 branches moved to harmonized Tailwind-inspired colors
- Applied to HEROES, HERO_DEFS, all BranchDef colors, Nightborne inline branchColors

## Content
- ~85 upgrade desc entries rewritten (px→m, dmg→damage, cd→cooldown)
- Vael Ossuary: Lich removed → Undying Horde zombie-only ultimate
- Soul Siphon bones: shield mechanic (2 dmg absorbed per stack, consumed on hit)
- Vael skill descs rewritten (root, bones, rot mechanics explained)
- Bone pickup sprites (5 variants from craftpix undead tileset)
- Huntress Lyra icons (12 icons in spritesheet frames 75-86)

## Undead Map
- DarkBat enemy: fast melee flyer (64×64), replaces FlyingEye on undead
- FlyingDemon enemy: ranged flyer with fireball projectile (79×69)
- UNDEAD_ZONE_SPAWNS table with zone-appropriate enemy distribution
- Infinite map with ChunkManager (was bounded 3000×3000)
- Stone floor tiles (6 variants from user texture, purple zone tints)
- Undead decorations: ruins, crystals, dead trees, bones, skulls, graves
- Map toggle button on HeroSelectScene (☠/🌿)

## Bug Fixes
- Stale state on scene re-entry (HeroSelect/GameScene/UIScene reset in create)
- Try Again: passes startingBranch, kills all tweens/timers/enemies in shutdown
- Archer/DarkBat/FlyingDemon: sprite flip fixed (faces left by default)
- FlyingDemon/Archer: removed repeat:-1 tweens (glow/tip) that caused freeze
- Ranged cap: counts both Archer+FlyingDemon, max 5 near player
- Sifra frost aura: minRadius scales with upgrades (was fixed 60px)
- Lyra melee: huntress_attack anim created, isAttacking resets on complete
- Undead getZone: fixed to radiate from (0,0) not bounded map center
- ChunkManager: cleanup cached tiles on destroy, prevent stale grass on undead
- Gold/XP orbs: removed conflicting bob/alpha tweens, magnet scales with player speed, snap after 1.2s
- Blight pool: removed alpha pulse that caused visual size jumping

## Data
- MetaProgress: heroKills + heroTimeMs aggregate fields
- NotificationCenter: per-seedId delivery for patch notes
- All heroes except Khashin/Muller unlocked by default
- All branches unlocked (getUnlockedBranches returns __all__)
- Khashin unlock: Sifra→Ignara, Lyra hint: 300→1000 gold
