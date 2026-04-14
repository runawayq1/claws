---
type: community
cohesion: 0.29
members: 7
---

# Upgrade Tracker

**Cohesion:** 0.29 - loosely connected
**Members:** 7 nodes

## Members
- [[.branchProgress()]] - code - src/systems/UpgradeSystem.ts
- [[.getBranchChoices()]] - code - src/systems/UpgradeSystem.ts
- [[.getChoices()]] - code - src/systems/UpgradeSystem.ts
- [[.getLevel()]] - code - src/systems/UpgradeSystem.ts
- [[.isBranchSelection()]] - code - src/systems/UpgradeSystem.ts
- [[.pick()]] - code - src/systems/UpgradeSystem.ts
- [[UpgradeTracker]] - code - src/systems/UpgradeSystem.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Upgrade_Tracker
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_Map & Terrain Engine]]

## Top bridge nodes
- [[UpgradeTracker]] - degree 7, connects to 1 community