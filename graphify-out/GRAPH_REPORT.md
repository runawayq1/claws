# Graph Report - src/ + docs/  (2026-04-10)

## Corpus Check
- 75 files · ~163,712 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 751 nodes · 1068 edges · 96 communities detected
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `Player` - 51 edges
2. `UIScene` - 30 edges
3. `MetaProgress` - 26 edges
4. `GameScene` - 25 edges
5. `LobbyScene` - 25 edges
6. `GameScene` - 19 edges
7. `NetworkManager` - 18 edges
8. `Game Entry Point (main.ts)` - 18 edges
9. `Player` - 18 edges
10. `BaseEnemy` - 16 edges

## Surprising Connections (you probably didn't know these)
- `TestScene (dev-only)` --semantically_similar_to--> `GameScene`  [INFERRED] [semantically similar]
  src/scenes/TestScene.ts → src/scenes/GameScene.ts
- `shouldShowHint Function` --semantically_similar_to--> `MetaProgress Class`  [INFERRED] [semantically similar]
  src/systems/HintFlags.ts → src/systems/MetaProgress.ts
- `Khashin Sirocco/Haboob Stance System` --semantically_similar_to--> `Crystal Muller Spike/Eruption Stance System`  [INFERRED] [semantically similar]
  docs/khashin-design.md → docs/crystal-muller-design.md
- `Per-Hero Branch Unlock Design (Section 14)` --semantically_similar_to--> `Branch Mastery System Overview`  [INFERRED] [semantically similar]
  docs/design-hero-unlock-progression.md → docs/design-branch-mastery.md
- `Skill Challenge System Overview` --semantically_similar_to--> `Per-Hero Branch Unlock Design (Section 14)`  [INFERRED] [semantically similar]
  docs/skill-challenges-design.md → docs/design-hero-unlock-progression.md

## Hyperedges (group relationships)
- **Hero Unlock Progression Arc (Tutorial → Challenge → Purchase → Secret)** — tutorial_quest3, hero_unlock_sifra, hero_unlock_nazar, hero_unlock_huntress, hero_unlock_secret_muller [EXTRACTED 0.95]
- **Branch Mastery × Skill Levels × Curses Interaction System** — branch_mastery_overview, session_07b_skill_leveling, curses_branch_mastery_interaction [INFERRED 0.82]
- **Khashin Dual-Stance Blind Synergy (Haboob → Dune amplify)** — khashin_design_stance, khashin_design_dune, skill_stance_combos_khashin [EXTRACTED 0.90]
- **Main Menu Scene Navigation Flow** — nameinputscene_NameInputScene, startscene_StartScene, heroselectscene_HeroSelectScene, loadingscene_LoadingScene, gamescene_GameScene [EXTRACTED 0.95]
- **Encyclopedia Progressive Unlock System** — encyclopediascene_unlockHero, encyclopediascene_unlockUpgrade, encyclopediascene_unlockBranch, encyclopediascene_localStorage, heroselectscene_HeroSelectScene, levelupscene_LevelUpScene [EXTRACTED 0.90]
- **Hero Definition Arrays (duplicated across scenes)** — heroselectscene_HEROES, lobbyscene_HEROES, encyclopediascene_HERO_INFO, gamescene_loadheroassets [INFERRED 0.80]
- **Online Multiplayer Sync Pipeline** — networkmanager_networkManager, networkgameadapter_NetworkGameAdapter, inputcontroller_IInputController [EXTRACTED 0.95]
- **Meta-Progress Persistence Layer** — metaprogress_MetaProgress, supabaseclient_supabase, sessionlogger_SessionLogger, hintflags_shouldShowHint [INFERRED 0.82]
- **Loot Orb Magnet System** — xpsystem_XPSystem, xpsystem_GoldSystem, gameconfig_CONFIG [INFERRED 0.88]
- **Enemy Hierarchy with Wave Scaling** — grunt_Orc0, orc1_Orc1, orc2_Orc2, orc3_Orc3, sandgolem_SandGolem, flyingeye_FlyingEye, baseenemy_BaseEnemy [EXTRACTED 0.95]
- **Hero Attack Module Pattern** — player_Player, amun_attackShockwave, khashin_attackSandSwipe, sifra_attackIceShard, muller_attackCrystalWave, ignara_attackFireball, nazar_attackMelee, huntress_attackHuntressMelee [EXTRACTED 0.95]
- **Loot Spawn Chain: Chest to Pickup to Player** — chest_Chest, pickup_Pickup, player_Player [EXTRACTED 1.00]

## Communities

### Community 0 - "Map & Terrain Engine"
Cohesion: 0.06
Nodes (13): addDiagonalBg(), ensureTexture(), Orc0, load(), save(), shouldShowHint(), getRenderZoom(), resizeGame() (+5 more)

### Community 1 - "Scene Navigation Hub"
Cohesion: 0.06
Nodes (55): BossTestScene (dev-only), EncyclopediaScene, HERO_INFO (lore + playstyle descriptions), UNLOCK_ALL Flag (dev bypass), Encyclopedia localStorage Helpers, unlockBranch (exported function), unlockHero (exported function), unlockUpgrade (exported function) (+47 more)

### Community 2 - "Player Core"
Cohesion: 0.07
Nodes (1): Player

### Community 3 - "Amun Hero Skills"
Cohesion: 0.05
Nodes (12): applyStun(), attackMelee(), die(), onUpdate(), retargetNearest(), takeDamage(), update(), attackSandSwipe() (+4 more)

### Community 4 - "Branch Mastery Design"
Cohesion: 0.06
Nodes (37): Branch Mastery Damage Bonus Per Branch, Branch Mastery Energy Cost Reduction Curve, Branch Mastery Levels (Practiced/Adept/Master), Branch Mastery System Overview, Rationale: Diminishing returns on cost reduction (preserve dual-bar tension), Rationale: XP gap is a feature (nudges playstyle identity), Branch Mastery for Heroes Without Dual Energy Bars, Branch Mastery XP Sources (cast, hit, kill) (+29 more)

### Community 5 - "UI Scene HUD"
Cohesion: 0.12
Nodes (1): UIScene

### Community 6 - "Meta Progression"
Cohesion: 0.15
Nodes (1): MetaProgress

### Community 7 - "Entity Hierarchy"
Cohesion: 0.17
Nodes (26): Amun applyStun, Amun attackShockwave, BaseEnemy, EnemySprite (type alias), Chest, ChestRarity, generateHeroFallbackTexture, FlyingEye (+18 more)

### Community 8 - "Game Scene Core"
Cohesion: 0.12
Nodes (1): GameScene

### Community 9 - "Lobby & Multiplayer UI"
Cohesion: 0.16
Nodes (1): LobbyScene

### Community 10 - "Encyclopedia System"
Cohesion: 0.19
Nodes (10): branchIconFrame(), EncyclopediaScene, isBranchUnlocked(), isHeroUnlocked(), isUpgradeUnlocked(), loadEncyclopedia(), saveEncyclopedia(), unlockBranch() (+2 more)

### Community 11 - "Network Manager"
Cohesion: 0.14
Nodes (1): NetworkManager

### Community 12 - "Input Controllers"
Cohesion: 0.12
Nodes (2): DummyInputController, KeyboardInputController

### Community 13 - "Meta & Achievements"
Cohesion: 0.13
Nodes (17): shouldShowHint Function, AchievementDef Interface, META_UPGRADES Definitions, MetaData Interface, MetaProgress Class, MetaUpgradeDef Interface, QuestDef Interface, RUN1_QUESTS Array (+9 more)

### Community 14 - "Level Up Scene"
Cohesion: 0.17
Nodes (2): addHighlightedDesc(), LevelUpScene

### Community 15 - "Network Game Adapter"
Cohesion: 0.23
Nodes (1): NetworkGameAdapter

### Community 16 - "Chunk Manager"
Cohesion: 0.38
Nodes (1): ChunkManager

### Community 17 - "Leaderboard Scene"
Cohesion: 0.33
Nodes (1): LeaderboardScene

### Community 18 - "Chest & Loot"
Cohesion: 0.33
Nodes (5): Chest, closedFrame(), contentsFrame(), openFrame(), openingFrame()

### Community 19 - "Wave Manager"
Cohesion: 0.33
Nodes (2): pickWeighted(), WaveManager

### Community 20 - "Session Balance Notes"
Cohesion: 0.22
Nodes (9): Rationale: Skill Level Architecture (apply delta, merged skills as lvl3), Sifra Branch Merge (3 ice to 2 ice + lightning), Skill Leveling System (3 levels per skill), Session 2026-04-09: Generics Rebalance (~40% nerf), Generic Upgrades (g1-g10), Ignara Skill Descriptions, Sifra Skill Descriptions, Skill Levels Design Doc (Ukrainian — 3 levels per skill) (+1 more)

### Community 21 - "Hero Stance Design"
Cohesion: 0.28
Nodes (9): Crystal Muller Shardfall Branch (Offensive), Crystal Muller Spike/Eruption Stance System, Khashin Dune Branch, Khashin Gale Branch, Khashin Mirage Branch, Khashin Sirocco/Haboob Stance System, Khashin Skill Descriptions, Khashin Stance Combo Reference (+1 more)

### Community 22 - "Undead Map Scene"
Cohesion: 0.29
Nodes (1): UndeadMapScene

### Community 23 - "Forge Scene"
Cohesion: 0.43
Nodes (1): ForgeScene

### Community 24 - "Core Config Types"
Cohesion: 0.29
Nodes (8): ChunkManager Class, CONFIG Constants Object, getSteeringTarget (Pathfinding), GameSceneContext Interface, WaveManager Class, ZONE_SPAWNS Table, GoldSystem Class, XPSystem Class

### Community 25 - "Input Abstractions"
Cohesion: 0.36
Nodes (8): DummyInputController Class, IInputController Interface, KeyboardInputController Class, NetworkGameAdapter Class, NetworkCallbacks Interface, NetworkManager Class, PlayerSlot Interface, networkManager Singleton

### Community 26 - "Upgrade Tracker"
Cohesion: 0.29
Nodes (1): UpgradeTracker

### Community 27 - "Muller Hero Skills"
Cohesion: 0.43
Nodes (4): attackCrystalEruption(), crystalRingBurst(), spawnCrystalSpike(), updateMullerPassives()

### Community 28 - "Icon Workflow"
Cohesion: 0.29
Nodes (7): Asset: skill_icons_sheet.png (1280×1280, 10×10 grid), Icon Generation Prompts — Guidelines and Style, Session 2026-04-06: Icon System Fix (static ICON_FRAME_MAP), Lesson: Never derive icon frame indices from runtime data, Skill Reference — sourced from UpgradeSystem.ts, Systems Overview — Upgrade System Reference, Upgrade Registry — All Upgrades with Effects

### Community 29 - "Profile Scene"
Cohesion: 0.53
Nodes (1): ProfileScene

### Community 30 - "Loading Scene"
Cohesion: 0.4
Nodes (1): LoadingScene

### Community 31 - "XP System"
Cohesion: 0.33
Nodes (1): XPSystem

### Community 32 - "Curses System"
Cohesion: 0.33
Nodes (6): Curse Duality Test — Buff Must Compensate Debuff, Curse List (12 Base Curses C01-C12), Prestige Curses (Entropy, Empty Vessel, Sovereign), Rationale: Every curse must have exploitable buff (Duality Test), Curse Combination Synergy Effects, Roadmap — Cursed Relics (planned, not implemented)

### Community 33 - "Hero Select Scene"
Cohesion: 0.4
Nodes (1): HeroSelectScene

### Community 34 - "Boss Test Scene"
Cohesion: 0.4
Nodes (1): BossTestScene

### Community 35 - "Swords Test Scene"
Cohesion: 0.4
Nodes (1): SwordsTestScene

### Community 36 - "Gold System"
Cohesion: 0.4
Nodes (1): GoldSystem

### Community 37 - "FlyingEye Enemy"
Cohesion: 0.4
Nodes (1): FlyingEye

### Community 38 - "SandGolem Enemy"
Cohesion: 0.5
Nodes (1): SandGolem

### Community 39 - "Start Scene"
Cohesion: 0.5
Nodes (1): StartScene

### Community 40 - "Test Scene"
Cohesion: 0.5
Nodes (1): TestScene

### Community 41 - "Pickup System"
Cohesion: 0.67
Nodes (1): Pickup

### Community 42 - "Orc1 Enemy"
Cohesion: 0.5
Nodes (1): Orc1

### Community 43 - "Orc2 Enemy"
Cohesion: 0.5
Nodes (1): Orc2

### Community 44 - "Endgame & Roadmap"
Cohesion: 0.5
Nodes (4): Curse Reward Scaling (gold/meta-XP multipliers), Boss Klaus — Inline GameScene, Instant Kill, Game Design Roadmap — Core Loop and Motivation, Game Design Roadmap — Feature Status Table v0.4.2

### Community 45 - "Lore & Narrative"
Cohesion: 0.67
Nodes (3): Crystal Muller Lore — Gnome Miner Origin, Khashin Lore — Wind Elemental Origin, Game Design Roadmap — Story and Lore (Sand Sea, Bramwomb)

### Community 46 - "Miniboss Design"
Cohesion: 0.67
Nodes (3): SandGolem Enemy — Mini-Boss Stats and Ground Slam, Project Status — Mini-Boss System Design (Idea #16), Sandstone Sentinel Optional Mid-Run Event

### Community 47 - "Project Status Docs"
Cohesion: 0.67
Nodes (3): Player Class Fields Reference, Project Status v0.3.3 Overview, Systems Overview — Hero Stats Table

### Community 48 - "Icon Frame Mapping"
Cohesion: 0.67
Nodes (3): ICON_FRAME_MAP (Static), getIconFrame Function, getIconTexture Function

### Community 49 - "Skill Group"
Cohesion: 1.0
Nodes (2): Amun Skill Descriptions, Amun Stance Combo Reference

### Community 50 - "Session Group"
Cohesion: 1.0
Nodes (2): Rationale: Hero Locking via Set<HeroType>, Hero Selection Screen (locked/unlocked heroes)

### Community 51 - "Khashin Group"
Cohesion: 1.0
Nodes (2): Khashin Wind Slash Attack Mechanic, Khashin Design Notes — Unique Mechanics

### Community 52 - "Hero Group"
Cohesion: 1.0
Nodes (2): MetaProgress Schema for Hero Unlocks, Tutorial MetaProgress Integration (tutorialComplete, unlockedHeroes)

### Community 53 - "Crystal Group"
Cohesion: 1.0
Nodes (2): Crystal Muller Crystal Wave Attack Mechanic, Crystal Muller vs Amun Design Notes

### Community 54 - "Branch Group"
Cohesion: 1.0
Nodes (2): Branch Mastery UI — Diamond Dots Below Energy Bars, Session 2026-04-09: HUD Mastery Bar for All Heroes

### Community 55 - "Session Group"
Cohesion: 1.0
Nodes (2): Session 2026-04-06: Frost Aura Rework (procedural), Lesson: Procedural VFX over spritesheet VFX

### Community 56 - "Session Group"
Cohesion: 1.0
Nodes (2): Lesson: RenderTexture for static terrain (N draw calls once vs N/frame), Session 2026-04-06: Performance Optimization

### Community 57 - "Session Group"
Cohesion: 1.0
Nodes (2): Lesson: scene.resume() before scene.stop() order, Session 2026-04-07: Loading Rework (LoadingScene, 1.6s)

### Community 58 - "Enemy Group"
Cohesion: 1.0
Nodes (2): Enemy Registry — All Enemy Classes, Systems Overview — Enemy Stats Table

### Community 59 - "Undeadmapscene Group"
Cohesion: 1.0
Nodes (2): Island/Bridge Layout (undead map), isOnGround (island+bridge collision)

### Community 60 - "Bgscroll Group"
Cohesion: 1.0
Nodes (2): addDiagonalBg (BG Scroll), spawnTrailCircle (Trail Pool)

### Community 61 - "Device Group"
Cohesion: 1.0
Nodes (2): isMobileDevice, isMobileUserAgent

### Community 62 - "Skill Group"
Cohesion: 1.0
Nodes (1): Nazar Skill Descriptions

### Community 63 - "Skill Group"
Cohesion: 1.0
Nodes (1): Huntress (Lyra) Skill Descriptions

### Community 64 - "Skill Group"
Cohesion: 1.0
Nodes (1): Muller (Givi) Skill Descriptions

### Community 65 - "Session Group"
Cohesion: 1.0
Nodes (1): LevelUpScene 5-Card Layout

### Community 66 - "Session Group"
Cohesion: 1.0
Nodes (1): ESC Hotkey All Scenes Convention

### Community 67 - "Khashin Group"
Cohesion: 1.0
Nodes (1): Khashin Base Stats

### Community 68 - "Crystal Group"
Cohesion: 1.0
Nodes (1): Crystal Muller Base Stats

### Community 69 - "Crystal Group"
Cohesion: 1.0
Nodes (1): Crystal Muller Geode Shell Branch (Defensive)

### Community 70 - "Crystal Group"
Cohesion: 1.0
Nodes (1): Crystal Muller Deep Seam Branch (Field Control)

### Community 71 - "Skill Group"
Cohesion: 1.0
Nodes (1): Ignara Stance Combo Reference

### Community 72 - "Skill Group"
Cohesion: 1.0
Nodes (1): Nazar Stance Combo Reference

### Community 73 - "Skill Group"
Cohesion: 1.0
Nodes (1): Huntress Stance Combo Reference

### Community 74 - "Skill Group"
Cohesion: 1.0
Nodes (1): Generic Upgrades Cross-Hero Rankings

### Community 75 - "Session Group"
Cohesion: 1.0
Nodes (1): Session 2026-04-07: Bug Fixes (skill freeze, goblin anim)

### Community 76 - "Session Group"
Cohesion: 1.0
Nodes (1): Session 2026-04-07: Chest System (spritesheet chests)

### Community 77 - "Session Group"
Cohesion: 1.0
Nodes (1): Session 2026-04-07: BigOrc Mini-Boss

### Community 78 - "Session Group"
Cohesion: 1.0
Nodes (1): Session 2026-04-07: Camera-Based Spawn System

### Community 79 - "Curses Group"
Cohesion: 1.0
Nodes (1): Curses System Overview — Endgame Layer

### Community 80 - "Curses Group"
Cohesion: 1.0
Nodes (1): Curse Unlock Paths and Conditions

### Community 81 - "Curses Group"
Cohesion: 1.0
Nodes (1): Curse Stacking Rules (max 3, incompatible pairs)

### Community 82 - "Session Group"
Cohesion: 1.0
Nodes (1): Session 2026-04-08: Level-Up Card UI (sealed cards, flip animation)

### Community 83 - "Session Group"
Cohesion: 1.0
Nodes (1): Session 2026-04-08: Mobile Stance Controls and Scaling

### Community 84 - "Session Group"
Cohesion: 1.0
Nodes (1): Session 2026-04-09: Card UI Polish (confetti, pulse strip)

### Community 85 - "Session Group"
Cohesion: 1.0
Nodes (1): Session 2026-04-09: Pause Menu Restructure (Stats/Inventory tabs)

### Community 86 - "Icon Group"
Cohesion: 1.0
Nodes (1): Icon Prompts for Generic Skills (g1-g10)

### Community 87 - "Icon Group"
Cohesion: 1.0
Nodes (1): Icon Prompts for Ignara Skills

### Community 88 - "Roadmap Group"
Cohesion: 1.0
Nodes (1): Roadmap — Elemental Combos (Ice+Fire, Wind+Fire)

### Community 89 - "Asset Group"
Cohesion: 1.0
Nodes (1): Asset Inventory — Loaded vs Unused Assets

### Community 90 - "Systems Group"
Cohesion: 1.0
Nodes (1): Systems Overview — Wave Manager Config

### Community 91 - "Systems Group"
Cohesion: 1.0
Nodes (1): Systems Overview — Encyclopedia System

### Community 92 - "Project Group"
Cohesion: 1.0
Nodes (1): Project Status — Known Issues

### Community 93 - "Device Group"
Cohesion: 1.0
Nodes (1): isPortrait

### Community 94 - "Baseenemy Group"
Cohesion: 1.0
Nodes (1): DamageType

### Community 95 - "Muller Group"
Cohesion: 1.0
Nodes (1): Muller spawnCrystalShard

## Knowledge Gaps
- **138 isolated node(s):** `Nazar Skill Descriptions`, `Amun Skill Descriptions`, `Huntress (Lyra) Skill Descriptions`, `Muller (Givi) Skill Descriptions`, `Skill Reference — sourced from UpgradeSystem.ts` (+133 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Skill Group`** (2 nodes): `Amun Skill Descriptions`, `Amun Stance Combo Reference`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Session Group`** (2 nodes): `Rationale: Hero Locking via Set<HeroType>`, `Hero Selection Screen (locked/unlocked heroes)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Khashin Group`** (2 nodes): `Khashin Wind Slash Attack Mechanic`, `Khashin Design Notes — Unique Mechanics`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Hero Group`** (2 nodes): `MetaProgress Schema for Hero Unlocks`, `Tutorial MetaProgress Integration (tutorialComplete, unlockedHeroes)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Crystal Group`** (2 nodes): `Crystal Muller Crystal Wave Attack Mechanic`, `Crystal Muller vs Amun Design Notes`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Branch Group`** (2 nodes): `Branch Mastery UI — Diamond Dots Below Energy Bars`, `Session 2026-04-09: HUD Mastery Bar for All Heroes`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Session Group`** (2 nodes): `Session 2026-04-06: Frost Aura Rework (procedural)`, `Lesson: Procedural VFX over spritesheet VFX`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Session Group`** (2 nodes): `Lesson: RenderTexture for static terrain (N draw calls once vs N/frame)`, `Session 2026-04-06: Performance Optimization`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Session Group`** (2 nodes): `Lesson: scene.resume() before scene.stop() order`, `Session 2026-04-07: Loading Rework (LoadingScene, 1.6s)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Enemy Group`** (2 nodes): `Enemy Registry — All Enemy Classes`, `Systems Overview — Enemy Stats Table`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Undeadmapscene Group`** (2 nodes): `Island/Bridge Layout (undead map)`, `isOnGround (island+bridge collision)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Bgscroll Group`** (2 nodes): `addDiagonalBg (BG Scroll)`, `spawnTrailCircle (Trail Pool)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Device Group`** (2 nodes): `isMobileDevice`, `isMobileUserAgent`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Skill Group`** (1 nodes): `Nazar Skill Descriptions`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Skill Group`** (1 nodes): `Huntress (Lyra) Skill Descriptions`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Skill Group`** (1 nodes): `Muller (Givi) Skill Descriptions`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Session Group`** (1 nodes): `LevelUpScene 5-Card Layout`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Session Group`** (1 nodes): `ESC Hotkey All Scenes Convention`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Khashin Group`** (1 nodes): `Khashin Base Stats`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Crystal Group`** (1 nodes): `Crystal Muller Base Stats`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Crystal Group`** (1 nodes): `Crystal Muller Geode Shell Branch (Defensive)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Crystal Group`** (1 nodes): `Crystal Muller Deep Seam Branch (Field Control)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Skill Group`** (1 nodes): `Ignara Stance Combo Reference`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Skill Group`** (1 nodes): `Nazar Stance Combo Reference`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Skill Group`** (1 nodes): `Huntress Stance Combo Reference`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Skill Group`** (1 nodes): `Generic Upgrades Cross-Hero Rankings`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Session Group`** (1 nodes): `Session 2026-04-07: Bug Fixes (skill freeze, goblin anim)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Session Group`** (1 nodes): `Session 2026-04-07: Chest System (spritesheet chests)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Session Group`** (1 nodes): `Session 2026-04-07: BigOrc Mini-Boss`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Session Group`** (1 nodes): `Session 2026-04-07: Camera-Based Spawn System`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Curses Group`** (1 nodes): `Curses System Overview — Endgame Layer`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Curses Group`** (1 nodes): `Curse Unlock Paths and Conditions`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Curses Group`** (1 nodes): `Curse Stacking Rules (max 3, incompatible pairs)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Session Group`** (1 nodes): `Session 2026-04-08: Level-Up Card UI (sealed cards, flip animation)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Session Group`** (1 nodes): `Session 2026-04-08: Mobile Stance Controls and Scaling`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Session Group`** (1 nodes): `Session 2026-04-09: Card UI Polish (confetti, pulse strip)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Session Group`** (1 nodes): `Session 2026-04-09: Pause Menu Restructure (Stats/Inventory tabs)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Icon Group`** (1 nodes): `Icon Prompts for Generic Skills (g1-g10)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Icon Group`** (1 nodes): `Icon Prompts for Ignara Skills`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Roadmap Group`** (1 nodes): `Roadmap — Elemental Combos (Ice+Fire, Wind+Fire)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Asset Group`** (1 nodes): `Asset Inventory — Loaded vs Unused Assets`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Systems Group`** (1 nodes): `Systems Overview — Wave Manager Config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Systems Group`** (1 nodes): `Systems Overview — Encyclopedia System`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Project Group`** (1 nodes): `Project Status — Known Issues`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Device Group`** (1 nodes): `isPortrait`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Baseenemy Group`** (1 nodes): `DamageType`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Muller Group`** (1 nodes): `Muller spawnCrystalShard`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Player` connect `Player Core` to `Map & Terrain Engine`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `UIScene` connect `UI Scene HUD` to `Map & Terrain Engine`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `MetaProgress` connect `Meta Progression` to `Map & Terrain Engine`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **What connects `Nazar Skill Descriptions`, `Amun Skill Descriptions`, `Huntress (Lyra) Skill Descriptions` to the rest of the system?**
  _138 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Map & Terrain Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Scene Navigation Hub` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Player Core` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._