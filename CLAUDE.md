# CLAWS Project

Vampire Survivors-style game. Phaser 3 + Vite + TypeScript.

## Agent Rules

- Always launch subagents (Agent tool) with `model: "sonnet"` to save cost/speed.
- If a task goes beyond the subagent's function scope, escalate it back to the main agent (Opus). The subagent should return its findings and explicitly state what needs to be handled by the main agent.
- A concept/story writer subagent does NOT write game mechanic code. It returns lore, descriptions, and design — the main agent implements mechanics.
- Subagents are for: file search, code exploration, documentation lookup, type-checking, concept writing, lore/narrative drafts.
- Subagents are NOT for: writing game mechanic code, editing gameplay files, making architectural decisions, multi-step implementations.
