# Asset Inventory

LOADED = referenced in preload() of GameScene/UndeadMapScene/StartScene/EncyclopediaScene.
UNUSED = files exist on disk but not loaded.

---

## /skeleton
| File | Key | Loaded |
|---|---|---|
| Attack3.png | `skeleton_attack`, 150×150 | LOADED |

## /goblin
| File | Key | Loaded |
|---|---|---|
| Attack3.png | `goblin_attack`, 150×150 | LOADED |
| Bomb_sprite.png | — | UNUSED |

## /mushroom
| File | Key | Loaded |
|---|---|---|
| Attack3.png | `mushroom_attack`, 150×150 | LOADED |
| Projectile_sprite.png | — | UNUSED |

## /flying_eye
| File | Key | Loaded |
|---|---|---|
| Attack3.png | `flyingeye_attack`, 150×150 | LOADED |
| projectile_sprite.png | — | UNUSED |

---

## /fire_wizard  _(Ignara hero)_
| File | Key | Loaded |
|---|---|---|
| Idle.png | `ignara_idle`, 150×150 | LOADED (also StartScene) |
| Move.png | `ignara_run` | LOADED |
| Attack.png | `ignara_attack` | LOADED |
| Take Hit.png | `ignara_hurt` | LOADED |
| Death.png | `ignara_death` | LOADED |

## /wizard  _(Sifra hero)_
| File | Key | Loaded |
|---|---|---|
| Idle.png | `sifra_idle`, 231×190 | LOADED (also StartScene) |
| Run.png | `sifra_run` | LOADED |
| Attack1.png | `sifra_attack` | LOADED |
| Hit.png | `sifra_hurt` | LOADED |
| Death.png | `sifra_death` | LOADED |
| Attack2.png, Jump.png, Fall.png | — | UNUSED |

## /king  _(Amun hero)_
| File | Key | Loaded |
|---|---|---|
| Idle.png | `amun_idle`, 160×111 | LOADED (also StartScene) |
| Run.png | `amun_run` | LOADED |
| Attack1.png | `amun_attack` | LOADED |
| Take Hit.png | `amun_hurt` | LOADED |
| Death.png | `amun_death` | LOADED |
| Attack2.png, Attack3.png, Jump.png, Fall.png, Take Hit - white silhouette.png | — | UNUSED |

## /martial_hero  _(Nazar hero)_
| File | Key | Loaded |
|---|---|---|
| Idle.png | `nazar_idle`, 200×200 | LOADED (also StartScene) |
| Run.png | `nazar_run` | LOADED |
| Attack1.png | `nazar_attack` | LOADED |
| Take Hit.png | `nazar_hurt` | LOADED |
| Death.png | `nazar_death` | LOADED |
| Attack2.png, Jump.png, Fall.png, Take Hit - white silhouette.png | — | UNUSED |

## /huntress  _(Huntress/Lyra hero)_
| File | Key | Loaded |
|---|---|---|
| Idle.png | `huntress_idle`, 150×150 | LOADED (also StartScene) |
| Run.png | `huntress_run` | LOADED |
| Attack1.png | `huntress_attack` | LOADED |
| Attack2.png | `huntress_attack2` (melee alt, 5 frames) | LOADED |
| Attack3.png | `huntress_ranged` (spear throw, 5 frames used) | LOADED |
| Take hit.png | `huntress_hurt` | LOADED |
| Death.png | `huntress_death` | LOADED |

## /evil_wizard  _(Khet — removed from roster)_
All files UNUSED. Load calls commented out. Hero can be re-added by uncommenting.

---

## /vfx
| File | Key | Loaded |
|---|---|---|
| flamethrower_sheet.png | `vfx_flame`, 64×24 | LOADED |
| flamethrower_preview.png | — | UNUSED |
| flame_frame_0–4.png | — | UNUSED (individual frames, sheet used) |

**Generated textures** (procedural, no file): `vfx_flame` (16×16 blob), `vfx_smoke`, `vfx_spark`, `vfx_slash`, `claws_boss`, various grave textures.

---

## /icons
| File | Key | Loaded |
|---|---|---|
| skill_icons_sheet.png | `skill_icons`, 32×32 per frame | LOADED |
| skill_icons_preview.png | — | UNUSED |
| icon_index.json | — | UNUSED (reference only) |
| 68 individual icon PNGs | — | UNUSED (sheet used instead) |

---

## /rocks  _(40 files total, Rock1–8 × sizes 1–5)_
| Keys | Files | Status |
|---|---|---|
| `rock1_1`, `rock1_2`, `rock2_1`, `rock2_2`, `rock3_1`, `rock3_2` | Rock1_1–2, Rock2_1–2, Rock3_1–2 (no shadow variants) | LOADED (6 of 40) |
| Rock1_3–5 through Rock8_1–5 | — | UNUSED |

---

## /terrain
| File | Key | Loaded |
|---|---|---|
| TX Tileset Grass.png | `terrain_grass`, 32×32 frames | LOADED (GameScene grass map) |
| TX Tileset Stone Ground.png | `terrain_stone`, 32×32 frames | LOADED (preloaded, not used in drawTerrain currently) |
| tree1.png | `deco_tree1` | LOADED |
| tree2.png | `deco_tree2` | LOADED |
| tree3.png | `deco_tree3` | LOADED |
| TX Plant.png, TX Props.png, TX Struct.png, TX Shadow.png, TX Shadow Plant.png, TX Player.png | — | UNUSED |

**Note:** GameScene terrain is pure grass — `terrain_stone` is preloaded but the `drawTerrain()` override only uses grass frames. No stone patches in current implementation.

---

## /props
| File | Key | Loaded |
|---|---|---|
| grass_tuft1.png | `prop_grass_tuft1` | LOADED |
| grass_tuft3.png | `prop_grass_tuft3` | LOADED |
| All other files (barrel, bushes, chests, crates, doors, fountain, gravestones, rubble, signposts, stones, tomb statue, vase, well) | — | UNUSED |

---

## /undead  _(UndeadMapScene only)_

### Ground tileset
| File | Key | Notes |
|---|---|---|
| Ground_rocks.png | `undead_ground` | 416×1392px, 16×16 tiles, 26 cols × 87 rows. Loaded as spritesheet. Scale 4 = 64px game tiles. |
| Water_coasts.png | — | On disk, not loaded |
| Details.png | — | On disk, not loaded |

### Prop images (19 keys, all in `assets/undead/`)
| Key | File | Scale |
|---|---|---|
| `undead_grave1–4` | `Grave_shadow1_1–4.png` | 2.5 |
| `undead_ruin1–3` | `Ruin_shadow1_1–3.png` | 1 / 1 / 1.5 |
| `undead_dead_tree1–2` | `Dead_tree_shadow1_1–2.png` | 1 |
| `undead_broken_tree1–2` | `Broken_tree_shadow1_1–2.png` | 1 / 3 |
| `undead_crystal1–2` | `Crystal_shadow1_1–2.png` | 1.5 |
| `undead_bones1–2` | `Bones_shadow1_1–2.png` | 3 / 5 |
| `undead_skulls` | `Pile_sculls_shadow1.png` | 0.8 |
| `undead_dead_arm` | `Dead_arm_shadow1_1.png` | 1.5 |
| `undead_thorn1–2` | `Thorn_plant_shadow1_1–2.png` | 0.9 |

---

## /book  _(EncyclopediaScene)_
| File | Key | Notes |
|---|---|---|
| pages_apper.png | `book_page` | Book page background image |
| info_tileset.png | `book_tileset` | UI tileset |
| book_content.png | `book_content` | 336×448; hero medallion crops defined in `HERO_MEDALLION` |
| Icons.png | `book_icons` | Spritesheet, 32×32 frames |
| sells_full.png | `book_sells` | Spritesheet, 32×24 frames |
| bookmarks.png | `book_bookmarks` | Spritesheet, 32×28 per frame, 2 cols × 5 rows (inactive/active per hero) |
| book_anim.png | `book_anim` | 12-frame animation, 542×542 per frame (StartScene book icon) |

---

## Legacy / future character assets (unused)
| Folder | Approx total |
|---|---|
| /hero | ~100K (10 files) |
| /orc | ~100K (10 files) |
| /soldier | ~238K (11 files) |
