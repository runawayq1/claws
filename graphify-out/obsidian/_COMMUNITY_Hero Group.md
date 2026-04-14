---
type: community
cohesion: 1.00
members: 2
---

# Hero Group

**Cohesion:** 1.00 - tightly connected
**Members:** 2 nodes

## Members
- [[MetaProgress Schema for Hero Unlocks]] - document - docs/design-hero-unlock-progression.md
- [[Tutorial MetaProgress Integration (tutorialComplete, unlockedHeroes)]] - document - docs/design-tutorial-scenario.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Hero_Group
SORT file.name ASC
```
