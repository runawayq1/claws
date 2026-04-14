# Cheat Panel (Desktop Only)

Press **` ` `** (backtick / tilde key) during gameplay to toggle the cheat panel.

The panel appears in the bottom-left corner. Press backtick again to hide it.

## Controls

| Button | Effect |
|--------|--------|
| **Speed x2** | Doubles player movement speed (stacks on each click) |
| **Full HP** | Instantly restores HP to maximum |
| **+10 Levels** | Triggers 10 level-ups in a row (opens upgrade picker for each) |
| **God Mode** | Toggles invincibility — HP stays at max every frame. Button turns green when active |
| **Kill All** | Kills every enemy currently on screen |
| **Spawn Boss** | Spawns the Claws boss immediately (clears all regular enemies first) |
| **Level Up** | Triggers a single level-up |
| **+1000 Gold** | Drops 10 gold orbs worth 100 each near the player |

## Notes

- The panel is **desktop only** — it does not appear on mobile devices.
- God Mode keeps HP topped off but does not prevent knockback or status effects.
- Speed x2 stacks multiplicatively — clicking 3 times = 8x speed.
- +10 Levels opens the upgrade picker after the first level-up. Pick an upgrade and the next level-up triggers immediately after.
- The panel state resets when starting a new run.

## Source

Implementation: `src/scenes/UIScene.ts` — `setupCheatPanel()` method.
