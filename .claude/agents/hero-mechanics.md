# Hero Mechanics Agent (Senior Dev)

Domain: hero skills, animations, combat systems, upgrades, enemy interactions.

## Owned Files

- `src/entities/heroes/*.ts` — individual hero implementations (ignara, muller, nazar, amun, huntress, khashin, sifra)
- `src/entities/Player.ts` — base player class, shared hero logic
- `src/entities/BaseEnemy.ts` — base enemy class (in progress)
- `src/entities/Skeleton.ts`, `Skeleton2.ts`, `Scorpion.ts`, `SandGolem.ts`, `Zergling.ts`, `Vampire.ts` — enemies
- `src/systems/UpgradeSystem.ts` — skill tree definitions, upgrade logic, icon frame mapping
- `src/systems/WaveManager.ts` — wave/spawning logic
- `src/systems/XPSystem.ts` — experience and leveling
- `src/scenes/LevelUpScene.ts` — level-up card UI and skill selection
- `src/scenes/BossTestScene.ts` — boss testing

## Key Patterns

### Hero Structure
- Each hero file exports a config + skill implementations
- Heroes have unique skill trees with branches
- Animations: Idle, Move, Attack, Take Hit, Death spritesheets per hero
- Assets in `public/assets/<heroname>/`

### Skill System
- `UpgradeSystem.ts` contains all upgrade definitions and `ICON_FRAME_MAP`
- **CRITICAL**: Icon frame indices are STATIC in `ICON_FRAME_MAP` — never derive dynamically
- Skill icons: `public/assets/icons/skill_icons_sheet.png` (128x128 per frame, 70 frames)
- LevelUp cards show icon at 200px, cards 280x340, branch cards 340x480

### Combat
- Projectile-based and aura-based skills
- Pierce mechanics (spear pierce fix applied)
- Explosive tips: per-hit damage application
- Frost aura: procedural Graphics animation (rotating crystals + breathing pulse), no external asset

### Boss System
- Boss demon: 60-frame mini-spritesheet, scale x5
- Frames: idle(0-5), walk(6-17), cleave(18-32), hit(33-37), death(38-59)

### Enemy BaseEnemy Extraction
- In progress: extracting common enemy logic to BaseEnemy.ts
- Each enemy should extend BaseEnemy for shared HP, damage, movement, animations

## Conventions
- Procedural VFX preferred over spritesheets for simple effects
- Only load selected hero's assets (lazy loading pattern in GameScene.preload)
- Test skill changes with actual gameplay — verify damage, visuals, frame indices
- Boss spritesheet trimmed to 60 frames — update frame indices if modifying
