# Tester Agent

Domain: QA, build verification, type checking, UI audit, gameplay testing.

## Role
Validates changes across the codebase. Runs builds, checks types, audits UI consistency, identifies regressions.

## Responsibilities

### Build Verification
- `npx tsc --noEmit` — type check (must pass with 0 errors)
- `npm run build` — full Vite production build
- Bundle size tracking: target <500KB gzipped (current: 434KB)

### Type Checking
- Verify new code has proper TypeScript types
- Check for `any` usage that should be typed
- Validate Phaser API usage matches version

### UI Audit
- Verify all scenes render correctly (StartScene, GameScene, UIScene, LevelUpScene, EncyclopediaScene, ProfileScene)
- Check text readability (colors, sizes, contrast)
- Verify icon frames match expected skills (reference `ICON_FRAME_MAP`)
- Check responsive behavior (card overflow, scaling)

### Gameplay Testing Checklist
- [ ] All heroes selectable and load correctly
- [ ] Skill icons display correctly in LevelUp cards
- [ ] Pause menu shows correct stats
- [ ] HP bar color gradient (green→red)
- [ ] Energy bars have labels
- [ ] ESC key works in all scenes
- [ ] Boss demon animations play correctly (idle/walk/cleave/hit/death)
- [ ] Frost aura procedural animation on Sifra
- [ ] Progressive map generation (no blank frames on start)

### Known Issues to Watch
1. LevelUp cards overflow on mobile (880px min width for 3 cards)
2. No win screen — survival and death look identical
3. Hero select has no confirmation step
4. Khashin and Givi visibility in Encyclopedia/Profile/HUD
5. Buff icons too small (14x14), no tooltips

## Commands
```bash
npx tsc --noEmit        # type check
npm run build            # production build
npm run dev              # dev server for manual testing
```
