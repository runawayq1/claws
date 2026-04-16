import Phaser from 'phaser'
import { type HeroType } from '../entities/Player'
import { gameFont } from '../utils/device'

export class LoadingScene extends Phaser.Scene {
  private hero: HeroType = 'ignara'
  private map = 'GameScene'
  private playerName = ''
  private online = false
  private seed = 0
  private playerSlots: any[] = []
  private startingBranch: string | null = null
  private barFill!: Phaser.GameObjects.Graphics
  private barX = 0
  private barY = 0
  private barW = 0
  private barH = 0
  private loadingText!: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'LoadingScene' })
  }

  init(data: { hero: HeroType; map: string; playerName?: string; online?: boolean; seed?: number; playerSlots?: any[]; startingBranch?: string }) {
    this.hero = data.hero || 'ignara'
    this.map = data.map || 'GameScene'
    this.playerName = data.playerName || ''
    this.online = data.online ?? false
    this.seed = data.seed ?? 0
    this.playerSlots = data.playerSlots ?? []
    this.startingBranch = data.startingBranch ?? null
  }

  preload() {
    const { width, height } = this.scale

    // ── Progress bar UI ──
    this.cameras.main.setBackgroundColor(0x0d0d1a)

    const loadTitle = this.add.text(width / 2, height * 0.35, 'CLAWS', {
      fontFamily: gameFont(), fontSize: '48px',
      color: '#FFD700',
    }).setOrigin(0.5)
    loadTitle.setShadow(0, 1, '#000000', 2, true, true)

    this.add.text(width / 2, height * 0.35 + 48, 'Survive the Swarm', {
      fontFamily: gameFont(), fontSize: '16px',
      color: '#888888',
    }).setOrigin(0.5)

    this.barW = width * 0.6
    this.barH = 20
    this.barX = width / 2 - this.barW / 2
    this.barY = height * 0.58

    // Background track
    const barBg = this.add.graphics()
    barBg.fillStyle(0x222233)
    barBg.fillRect(this.barX - 2, this.barY - 2, this.barW + 4, this.barH + 4)
    barBg.lineStyle(1, 0x444466)
    barBg.strokeRect(this.barX - 2, this.barY - 2, this.barW + 4, this.barH + 4)

    // Gold fill bar (starts at 0 width)
    this.barFill = this.add.graphics()

    // Percentage text centered ON the bar
    const pctText = this.add.text(width / 2, this.barY + this.barH / 2, '0%', {
      fontFamily: gameFont(), fontSize: '11px',
      color: '#000000',
    }).setOrigin(0.5).setDepth(1)

    // Flavor text below the bar — cycles on each progress tick
    const flavorTexts = [
      'The Bramauthroba never sleeps...',
      'Counting dunes in the Pishane...',
      'Brushing sand off Amunat ruins...',
      'The Swarm does not wait for you...',
      'Consulting the ruins of Amunat...',
      'Khashin was born in a sandstorm. You were not.',
      'An-Nubis, Warden of the Rift, is displeased...',
      'Ignara burned the Academy. She has no regrets.',
      'Amun has been guarding this Key for 1000 years...',
      'The Bramauthroba yawns. Enemies pour through.',
      'Givi just wants to go home. The Rift disagrees.',
      'Nazar\'s clan is dead. The cult is not.',
    ]

    this.loadingText = this.add.text(width / 2, this.barY + this.barH + 18, flavorTexts[0], {
      fontFamily: gameFont(), fontSize: '13px',
      color: '#888888',
    }).setOrigin(0.5)

    // Asset loading fills bar to 90% — swap flavor text every ~10% progress
    let lastFlavorPct = 0
    let flavorIdx = 0
    this.load.on('progress', (value: number) => {
      const scaled = value * 0.9
      this.barFill.clear()
      this.barFill.fillStyle(0xFFD700)
      this.barFill.fillRect(this.barX, this.barY, this.barW * scaled, this.barH)
      pctText.setText(`${Math.floor(scaled * 100)}%`)

      // Change flavor text every ~10% of progress
      const pct10 = Math.floor(value * 10)
      if (pct10 > lastFlavorPct) {
        lastFlavorPct = pct10
        flavorIdx = (flavorIdx + 1) % flavorTexts.length
        this.loadingText.setText(flavorTexts[flavorIdx])
      }
    })

    this.load.on('complete', () => {
      this.barFill.clear()
      this.barFill.fillStyle(0xFFD700)
      this.barFill.fillRect(this.barX, this.barY, this.barW * 0.9, this.barH)
      pctText.setText('90%')

      // Shimmer pulse on the bar while waiting for terrain
      this.tweens.add({
        targets: this.barFill,
        alpha: { from: 1, to: 0.5 },
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    })

    // ── Load all game assets ──

    const ss = (key: string, path: string, fw: number, fh: number) => {
      if (!this.textures.exists(key)) {
        this.load.spritesheet(key, path, { frameWidth: fw, frameHeight: fh })
      }
    }
    const img = (key: string, path: string) => {
      if (!this.textures.exists(key)) {
        this.load.image(key, path)
      }
    }

    // Monster spritesheets
    ss('flyingeye_attack', 'assets/flying_eye/Attack3.png', 150, 150)

    // Orc enemies (64x64)
    ss('orc1_idle',   'assets/orc/orc1_idle_without_shadow.png',   64, 64)
    ss('orc1_run',    'assets/orc/orc1_run_without_shadow.png',    64, 64)
    ss('orc1_attack', 'assets/orc/orc1_attack_without_shadow.png', 64, 64)
    ss('orc1_hurt',   'assets/orc/orc1_hurt_without_shadow.png',   64, 64)
    ss('orc1_death',  'assets/orc/orc1_death_without_shadow.png',  64, 64)

    ss('orc2_idle',   'assets/orc2/orc2_idle_without_shadow.png',   64, 64)
    ss('orc2_run',    'assets/orc2/orc2_run_without_shadow.png',    64, 64)
    ss('orc2_attack', 'assets/orc2/orc2_attack_without_shadow.png', 64, 64)
    ss('orc2_hurt',   'assets/orc2/orc2_hurt_without_shadow.png',   64, 64)
    ss('orc2_death',  'assets/orc2/orc2_death_without_shadow.png',  64, 64)

    ss('orc3_idle',   'assets/orc3/orc3_idle_without_shadow.png',   64, 64)
    ss('orc3_run',    'assets/orc3/orc3_run_without_shadow.png',    64, 64)
    ss('orc3_attack', 'assets/orc3/orc3_attack_without_shadow.png', 64, 64)
    ss('orc3_hurt',   'assets/orc3/orc3_hurt_without_shadow.png',   64, 64)
    ss('orc3_death',  'assets/orc3/orc3_death_without_shadow.png',  64, 64)

    // Boss demon (288x160)
    ss('boss_demon', 'assets/boss_demon/spritesheet.png', 288, 160)

    // VFX
    ss('vfx_flame', 'assets/vfx/flamethrower_sheet.png', 64, 24)

    // Skill icons (128x128)
    ss('skill_icons', 'assets/icons/skill_icons_sheet.png', 128, 128)

    // Card backgrounds (level-up UI)
    img('card_back', 'assets/ui/card_back.png')
    img('card_back_lg', 'assets/ui/card_back_lg.png')
    img('card_sealed', 'assets/ui/card_sealed.png')
    img('card_sealed_lg', 'assets/ui/card_sealed_lg.png')

    // Chest spritesheet (32x32, 9 cols x 4 rows)
    ss('chests', 'assets/chests/chests.png', 32, 32)

    // Rocks
    img('rock1_1', 'assets/rocks/Rock1_1_no_shadow.png')
    img('rock1_2', 'assets/rocks/Rock1_2_no_shadow.png')
    img('rock2_1', 'assets/rocks/Rock2_1_no_shadow.png')
    img('rock2_2', 'assets/rocks/Rock2_2_no_shadow.png')
    img('rock3_1', 'assets/rocks/Rock3_1_no_shadow.png')
    img('rock3_2', 'assets/rocks/Rock3_2_no_shadow.png')

    // Terrain
    ss('terrain_grass', 'assets/terrain/TX Tileset Grass.png', 32, 32)
    ss('terrain_stone', 'assets/terrain/TX Tileset Stone Ground.png', 32, 32)
    img('deco_tree1', 'assets/terrain/tree1.png')
    img('deco_tree2', 'assets/terrain/tree2.png')
    img('deco_tree3', 'assets/terrain/tree3.png')

    // Props
    img('prop_grass_tuft1', 'assets/props/grass_tuft1.png')
    img('prop_grass_tuft3', 'assets/props/grass_tuft3.png')

    // Hero-specific assets — in multiplayer, load all heroes in the lobby
    this.loadHeroAssets(this.hero, ss)
    if (this.online && this.playerSlots.length > 0) {
      for (const slot of this.playerSlots) {
        if (slot.heroType && slot.heroType !== this.hero) {
          this.loadHeroAssets(slot.heroType, ss)
        }
      }
    }

    // Undead map assets (only when needed)
    if (this.map === 'UndeadMapScene') {
      ss('undead_ground', 'assets/undead/Ground_rocks.png', 16, 16)
      img('undead_grave1',       'assets/undead/Grave_shadow1_1.png')
      img('undead_grave2',       'assets/undead/Grave_shadow1_2.png')
      img('undead_grave3',       'assets/undead/Grave_shadow1_3.png')
      img('undead_grave4',       'assets/undead/Grave_shadow1_4.png')
      img('undead_ruin1',        'assets/undead/Ruin_shadow1_1.png')
      img('undead_ruin2',        'assets/undead/Ruin_shadow1_2.png')
      img('undead_ruin3',        'assets/undead/Ruin_shadow1_3.png')
      img('undead_dead_tree1',   'assets/undead/Dead_tree_shadow1_1.png')
      img('undead_dead_tree2',   'assets/undead/Dead_tree_shadow1_2.png')
      img('undead_broken_tree1', 'assets/undead/Broken_tree_shadow1_1.png')
      img('undead_broken_tree2', 'assets/undead/Broken_tree_shadow1_2.png')
      img('undead_crystal1',     'assets/undead/Crystal_shadow1_1.png')
      img('undead_crystal2',     'assets/undead/Crystal_shadow1_2.png')
      img('undead_bones1',       'assets/undead/Bones_shadow1_1.png')
      img('undead_bones2',       'assets/undead/Bones_shadow1_2.png')
      img('undead_skulls',       'assets/undead/Pile_sculls_shadow1.png')
      img('undead_dead_arm',     'assets/undead/Dead_arm_shadow1_1.png')
      img('undead_thorn1',       'assets/undead/Thorn_plant_shadow1_1.png')
      img('undead_thorn2',       'assets/undead/Thorn_plant_shadow1_2.png')
    }
  }

  private loadHeroAssets(hero: string, ss: (key: string, path: string, fw: number, fh: number) => void) {
    switch (hero) {
      case 'ignara':
        ss('ignara_idle',   'assets/ignara/Idle.png',     150, 150)
        ss('ignara_run',    'assets/ignara/Move.png',     150, 150)
        ss('ignara_attack', 'assets/ignara/Attack.png',   150, 150)
        ss('ignara_hurt',   'assets/ignara/Take Hit.png', 150, 150)
        ss('ignara_death',  'assets/ignara/Death.png',    150, 150)
        break
      case 'sifra':
        ss('sifra_idle',    'assets/sifra/Idle.png',    231, 190)
        ss('sifra_run',     'assets/sifra/Run.png',     231, 190)
        ss('sifra_attack',  'assets/sifra/Attack1.png', 231, 190)
        ss('sifra_attack2', 'assets/sifra/Attack2.png', 231, 190)
        ss('sifra_hurt',    'assets/sifra/Hit.png',     231, 190)
        ss('sifra_death',   'assets/sifra/Death.png',   231, 190)
        break
      case 'nazar':
        ss('nazar_idle',    'assets/nazar/Idle.png',      200, 200)
        ss('nazar_run',     'assets/nazar/Run.png',       200, 200)
        ss('nazar_attack',  'assets/nazar/Attack1.png',   200, 200)
        ss('nazar_attack2', 'assets/nazar/Attack2.png',   200, 200)
        ss('nazar_hurt',    'assets/nazar/Take Hit.png',  200, 200)
        ss('nazar_death',   'assets/nazar/Death.png',     200, 200)
        break
      case 'amun':
        ss('amun_idle',    'assets/amun/Idle.png',      160, 111)
        ss('amun_run',     'assets/amun/Run.png',       160, 111)
        ss('amun_attack',  'assets/amun/Attack1.png',   160, 111)
        ss('amun_attack2', 'assets/amun/Attack2.png',   160, 111)
        ss('amun_attack3', 'assets/amun/Attack3.png',   160, 111)
        ss('amun_hurt',    'assets/amun/Take Hit.png',  160, 111)
        ss('amun_death',   'assets/amun/Death.png',     160, 111)
        break
      case 'huntress':
        ss('huntress_idle',    'assets/lyra/Idle.png',     150, 150)
        ss('huntress_run',     'assets/lyra/Run.png',      150, 150)
        ss('huntress_attack',  'assets/lyra/Attack1.png',  150, 150)
        ss('huntress_attack2', 'assets/lyra/Attack2.png',  150, 150)
        ss('huntress_ranged',  'assets/lyra/Attack3.png',  150, 150)
        ss('huntress_hurt',    'assets/lyra/Take hit.png', 150, 150)
        ss('huntress_death',   'assets/lyra/Death.png',    150, 150)
        break
      case 'khashin':
        ss('khashin_idle',       'assets/khashin/Idle.png',       288, 128)
        ss('khashin_run',        'assets/khashin/Run.png',        288, 128)
        ss('khashin_attack',     'assets/khashin/Attack.png',     288, 128)
        ss('khashin_air_attack', 'assets/khashin/Air_attack.png', 288, 128)
        ss('khashin_special',    'assets/khashin/Special.png',    288, 128)
        ss('khashin_hurt',       'assets/khashin/Take_hit.png',   288, 128)
        ss('khashin_death',      'assets/khashin/Death.png',      288, 128)
        break
      case 'muller':
        ss('muller_idle',        'assets/givi/Idle.png',         288, 128)
        ss('muller_run',         'assets/givi/Run.png',          288, 128)
        ss('muller_attack',      'assets/givi/Attack.png',       288, 128)
        ss('muller_ground_slam', 'assets/givi/Ground_slam.png',  288, 128)
        ss('muller_special',     'assets/givi/Special.png',      288, 128)
        ss('muller_hurt',        'assets/givi/Take_hit.png',     288, 128)
        ss('muller_death',       'assets/givi/Death.png',        288, 128)
        ss('crystal_green_0',    'assets/givi/crystal_green_0.png', 75, 78)
        ss('crystal_green_1',    'assets/givi/crystal_green_1.png', 65, 41)
        ss('crystal_pink_0',     'assets/givi/crystal_pink_0.png',  63, 61)
        ss('crystal_pink_1',     'assets/givi/crystal_pink_1.png',  30, 21)
        ss('crystal_blue_0',     'assets/givi/crystal_blue_0.png',  54, 51)
        ss('crystal_blue_1',     'assets/givi/crystal_blue_1.png',  43, 27)
        break
      case 'vael':
        // Vael has no spritesheet — reuses sifra visuals (tinted purple)
        ss('sifra_idle',    'assets/sifra/Idle.png',    231, 190)
        ss('sifra_run',     'assets/sifra/Run.png',     231, 190)
        ss('sifra_attack',  'assets/sifra/Attack1.png', 231, 190)
        ss('sifra_hurt',    'assets/sifra/Hit.png',     231, 190)
        ss('sifra_death',   'assets/sifra/Death.png',   231, 190)
        // Bone pickup sprites (variety for soul orbs on ground)
        for (const k of ['vael_bone_skull_1', 'vael_bone_pile_1', 'vael_bone_single_1', 'vael_bone_skull_2', 'vael_skull_small']) {
          if (!this.textures.exists(k)) this.load.image(k, `assets/vael/bones/${k.replace('vael_', '')}.png`)
        }
        break
    }
  }

  create() {
    // Launch game scene behind us, keep LoadingScene on top
    this.scene.launch(this.map, {
      hero: this.hero,
      playerName: this.playerName,
      online: this.online,
      seed: this.seed,
      playerSlots: this.playerSlots,
      startingBranch: this.startingBranch,
    })
    this.scene.bringToTop(this.scene.key)

    // Cycle flavor texts while waiting for terrain (timers work in create phase)
    const flavorCycler = this.time.addEvent({
      delay: 1500,
      loop: true,
      callback: () => {
        const texts = [
          'The Bramauthroba never sleeps...',
          'Counting dunes in the Pishane...',
          'Brushing sand off Amunat ruins...',
          'The Swarm does not wait for you...',
          'Consulting the ruins of Amunat...',
          'Khashin was born in a sandstorm. You were not.',
          'An-Nubis, Warden of the Rift, is displeased...',
          'Ignara burned the Academy. She has no regrets.',
          'Amun has been guarding this Key for 1000 years...',
          'The Bramauthroba yawns. Enemies pour through.',
          'Givi just wants to go home. The Rift disagrees.',
          'Nazar\'s clan is dead. The cult is not.',
        ]
        this.loadingText.setText(texts[Phaser.Math.Between(0, texts.length - 1)])
      },
    })

    // Wait for game scene to signal terrain is ready
    const gameScene = this.scene.get(this.map)
    const onReady = () => {
      flavorCycler.destroy()
      // Stop shimmer, fill bar to 100%
      this.tweens.killTweensOf(this.barFill)
      this.barFill.setAlpha(1)
      this.barFill.clear()
      this.barFill.fillStyle(0xFFD700)
      this.barFill.fillRect(this.barX, this.barY, this.barW, this.barH)
      this.loadingText.setText('Ready!')

      this.time.delayedCall(200, () => {
        this.cameras.main.fadeOut(400, 0, 0, 0)
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.stop(this.scene.key)
        })
      })
    }

    if (gameScene) {
      gameScene.events.once('terrain-ready', onReady)
    } else {
      this.time.delayedCall(500, onReady)
    }
  }
}
