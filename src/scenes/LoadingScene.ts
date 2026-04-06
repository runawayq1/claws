import Phaser from 'phaser'
import { type HeroType } from '../entities/Player'

export class LoadingScene extends Phaser.Scene {
  private hero: HeroType = 'ignara'
  private map = 'GameScene'
  private playerName = ''

  constructor() {
    super({ key: 'LoadingScene' })
  }

  init(data: { hero: HeroType; map: string; playerName?: string }) {
    this.hero = data.hero || 'ignara'
    this.map = data.map || 'GameScene'
    this.playerName = data.playerName || ''
  }

  preload() {
    const { width, height } = this.scale

    // ── Progress bar UI ──
    this.cameras.main.setBackgroundColor(0x0d0d1a)

    this.add.text(width / 2, height * 0.35, 'CLAWS', {
      fontFamily: 'monospace', fontSize: '48px',
      color: '#FFD700', stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.35 + 48, 'Survive the Swarm', {
      fontFamily: 'monospace', fontSize: '16px',
      color: '#888888', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5)

    const barW = width * 0.6
    const barH = 20
    const barX = width / 2 - barW / 2
    const barY = height * 0.58

    // Background track
    const barBg = this.add.graphics()
    barBg.fillStyle(0x222233)
    barBg.fillRect(barX - 2, barY - 2, barW + 4, barH + 4)
    barBg.lineStyle(1, 0x444466)
    barBg.strokeRect(barX - 2, barY - 2, barW + 4, barH + 4)

    // Gold fill bar (starts at 0 width)
    const barFill = this.add.graphics()

    const loadingText = this.add.text(width / 2, barY + barH + 18, 'Loading...', {
      fontFamily: 'monospace', fontSize: '13px',
      color: '#888888', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5)

    this.load.on('progress', (value: number) => {
      barFill.clear()
      barFill.fillStyle(0xFFD700)
      barFill.fillRect(barX, barY, barW * value, barH)
      const pct = Math.floor(value * 100)
      loadingText.setText(`Loading... ${pct}%`)
    })

    this.load.on('complete', () => {
      barFill.clear()
      barFill.fillStyle(0xFFD700)
      barFill.fillRect(barX, barY, barW, barH)
      loadingText.setText('Ready!')
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
    ss('mushroom_attack', 'assets/mushroom/Attack3.png', 150, 150)
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

    // Vampire (32x32)
    ss('vampire_idle',   'assets/vampire/idle.png',   32, 32)
    ss('vampire_run',    'assets/vampire/run.png',    32, 32)
    ss('vampire_attack', 'assets/vampire/attack.png', 32, 32)
    ss('vampire_hurt',   'assets/vampire/hurt.png',   32, 32)
    ss('vampire_death',  'assets/vampire/death.png',  32, 32)

    // Boss demon (288x160)
    ss('boss_demon', 'assets/boss_demon/spritesheet.png', 288, 160)

    // VFX
    ss('vfx_flame', 'assets/vfx/flamethrower_sheet.png', 64, 24)

    // Skill icons (128x128)
    ss('skill_icons', 'assets/icons/skill_icons_sheet.png', 128, 128)

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

    // Hero-specific assets
    this.loadHeroAssets(this.hero, ss)

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
    }
  }

  create() {
    this.scene.start(this.map, { hero: this.hero, playerName: this.playerName })
  }
}
