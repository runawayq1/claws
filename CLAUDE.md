# CLAWS Project

Vampire Survivors-style game. Phaser 3 + Vite + TypeScript.

## Agent Rules

- Always launch subagents (Agent tool) with `model: "sonnet"` to save cost/speed.
- Agents CAN write code within their assigned domain (see profiles below).
- If a task crosses domain boundaries or requires architectural decisions, escalate to the main agent (Opus).
- Use **profile agents** (defined in `.claude/agents/`) instead of spawning ad-hoc agents. Each profile has its own context file with domain knowledge and conventions.
- When spawning a profile agent, include: `Read .claude/agents/<profile>.md first for your domain context.`

## Agent Profiles

| Profile | File | Domain |
|---------|------|--------|
| Maps | `.claude/agents/maps.md` | Map scenes, terrain, zones, props, minimap |
| Encyclopedia | `.claude/agents/encyclopedia.md` | Encyclopedia UI, content pages, navigation |
| Hero Mechanics | `.claude/agents/hero-mechanics.md` | Hero skills, animations, combat, upgrades (senior dev) |
| Lore Writer | `.claude/agents/lore-writer.md` | Narrative, descriptions, flavor text, design docs |
| Architect | `.claude/agents/architect.md` | Architecture, systems, cross-cutting code, performance |
| UI Designer | `.claude/agents/ui-designer.md` | UI/UX design, menus, HUD, visual polish, screen layouts |
| Tester | `.claude/agents/tester.md` | QA, builds, type checking, UI audit, regression testing |
| Researcher | `.claude/agents/researcher.md` | Codebase analysis, UI audits, Phaser research, solution finding |

## Project Structure

- `src/scenes/` — Phaser scenes (GameScene, StartScene, UIScene, etc.)
- `src/entities/` — Player, enemies, heroes (in `heroes/` subfolder)
- `src/systems/` — UpgradeSystem, WaveManager, XPSystem, Pathfinding, etc.
- `public/assets/` — spritesheets, icons, terrain tiles
- `docs/` — session logs, design docs (Obsidian-compatible)

## Key Conventions

- Icon frame indices use static `ICON_FRAME_MAP` in UpgradeSystem.ts — never derive from runtime data
- Terrain uses RenderTexture baking (1 draw call vs thousands)
- Progressive map generation in 3 deferred packs for instant first frame
- Only selected hero's assets loaded (lazy loading in preload)
- Procedural VFX preferred over spritesheet VFX for simple patterns
