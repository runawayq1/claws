# Asset Inventory

LOADED = referenced in GameScene.ts or TestScene.ts preload (identical lists). StartScene loads hero Idle sheets via dynamic key.
UNUSED = present on disk, not loaded in any preload block.

---

## /goblin
| File | Size | Status |
|---|---|---|
| Attack3.png | 5.3K | LOADED (`goblin_attack`, 150×150) |
| Bomb_sprite.png | 4.8K | UNUSED |

## /mushroom
| File | Size | Status |
|---|---|---|
| Attack3.png | 4.2K | LOADED (`mushroom_attack`, 150×150) |
| Projectile_sprite.png | 878B | UNUSED |

## /flying_eye
| File | Size | Status |
|---|---|---|
| Attack3.png | 2.6K | LOADED (`flyingeye_attack`, 150×150) |
| projectile_sprite.png | 1.6K | UNUSED |

## /fire_wizard  _(Ignara hero)_
| File | Size | Status |
|---|---|---|
| Idle.png | 4.9K | LOADED (`ignara_idle`, 150×150) — also StartScene |
| Move.png | 5.3K | LOADED (`ignara_run`) |
| Attack.png | 6.0K | LOADED (`ignara_attack`) |
| Take Hit.png | 3.7K | LOADED (`ignara_hurt`) |
| Death.png | 5.1K | LOADED (`ignara_death`) |

## /wizard  _(Sifra hero)_
| File | Size | Status |
|---|---|---|
| Idle.png | 6.9K | LOADED (`sifra_idle`, 231×190) — also StartScene |
| Run.png | 11K | LOADED (`sifra_run`) |
| Attack1.png | 15K | LOADED (`sifra_attack`) |
| Hit.png | 6.8K | LOADED (`sifra_hurt`) |
| Death.png | 12K | LOADED (`sifra_death`) |
| Attack2.png | 14K | UNUSED |
| Jump.png | 3.4K | UNUSED |
| Fall.png | 3.4K | UNUSED |

## /king  _(Amun hero)_
| File | Size | Status |
|---|---|---|
| Idle.png | 5.5K | LOADED (`amun_idle`, 160×111) — also StartScene |
| Run.png | 6.1K | LOADED (`amun_run`) |
| Attack1.png | 5.2K | LOADED (`amun_attack`) |
| Take Hit.png | 4.5K | LOADED (`amun_hurt`) |
| Death.png | 5.9K | LOADED (`amun_death`) |
| Attack2.png | 4.4K | UNUSED |
| Attack3.png | 5.3K | UNUSED |
| Jump.png | 2.4K | UNUSED |
| Fall.png | 1.9K | UNUSED |
| Take Hit - white silhouette.png | 4.1K | UNUSED |

## /martial_hero  _(Nazar hero)_
| File | Size | Status |
|---|---|---|
| Idle.png | 5.0K | LOADED (`nazar_idle`, 200×200) — also StartScene |
| Run.png | 4.4K | LOADED (`nazar_run`) |
| Attack1.png | 5.4K | LOADED (`nazar_attack`) |
| Take Hit.png | 3.9K | LOADED (`nazar_hurt`) |
| Death.png | 5.1K | LOADED (`nazar_death`) |
| Attack2.png | 4.4K | UNUSED |
| Jump.png | 2.1K | UNUSED |
| Fall.png | 2.2K | UNUSED |
| Take Hit - white silhouette.png | 3.6K | UNUSED |

## /evil_wizard  _(Khet — commented out)_
| File | Size | Status |
|---|---|---|
| All 8 files (76K total) | — | UNUSED (hero removed from roster, load calls commented out) |

## /vfx
| File | Size | Status |
|---|---|---|
| flamethrower_sheet.png | 9.2K | LOADED (`vfx_flame`, 64×24) |
| flamethrower_preview.png | 14K | UNUSED |
| flame_frame_0–4.png | ~2.5K ea | UNUSED (individual frames, sheet used instead) |

## /icons
| File | Size | Status |
|---|---|---|
| skill_icons_sheet.png | 18K | LOADED (`skill_icons`, 32×32) |
| skill_icons_preview.png | 32K | UNUSED |
| icon_index.json | 1.5K | UNUSED (runtime ref only) |
| 68 individual icon PNGs (226–891B ea) | ~25K total | UNUSED (sheet used) |

## /rocks  _(40 files, Rock1–8 × sizes 1–5)_
| Loaded keys | Status |
|---|---|
| Rock1_1, Rock1_2, Rock2_1, Rock2_2, Rock3_1, Rock3_2 | LOADED (6 of 40) |
| Rock1_3–5, Rock2_3–5, Rock3_3–5, Rock4_1–5, Rock5_1–5, Rock6_1–5, Rock7_1–5, Rock8_1–5 | UNUSED (34 files, ~68K) |

## /terrain
| File | Size | Status |
|---|---|---|
| TX Tileset Grass.png | 11K | LOADED (`terrain_grass`, 32×32) |
| TX Tileset Stone Ground.png | 8.3K | LOADED (`terrain_stone`, 32×32) |
| tree1.png | 18K | LOADED (`deco_tree1`) |
| tree2.png | 15K | LOADED (`deco_tree2`) |
| tree3.png | 11K | LOADED (`deco_tree3`) |
| TX Plant.png | 64K | UNUSED |
| TX Props.png | 85K | UNUSED |
| TX Struct.png | 40K | UNUSED |
| TX Shadow.png | 8.9K | UNUSED |
| TX Shadow Plant.png | 3.3K | UNUSED |
| TX Player.png | 2.5K | UNUSED |

## /props  _(33 files, ~75K total)_
All UNUSED — barrel, bushes, chests, crates, doors, fountain, gravestones, rubble, signposts, stones, tomb statue, vase, well.

## /hero, /orc, /soldier, /huntress, /skeleton
All files UNUSED in current preload (legacy / future character assets).
| Folder | Approx total |
|---|---|
| hero | ~100K (10 files) |
| orc | ~100K (10 files) |
| soldier | ~238K (11 files) |
| huntress | ~30K (11 files) |
| skeleton | ~6K (2 files) |
