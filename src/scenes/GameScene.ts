import Phaser from 'phaser'
import { CONFIG } from '../config/GameConfig'
import { Player, type HeroType } from '../entities/Player'
import { Orc2 } from '../entities/Skeleton'
import { Orc1 } from '../entities/Zergling'
import { FlyingEye } from '../entities/Scorpion'
import { SandGolem } from '../entities/SandGolem'
import { Orc3 } from '../entities/Skeleton2'
import { Vampire } from '../entities/Vampire'
import { WaveManager } from '../systems/WaveManager'
import { XPSystem } from '../systems/XPSystem'
import { UpgradeTracker } from '../systems/UpgradeSystem'
import { Pickup, type PickupType } from '../entities/Pickup'
import { Chest } from '../entities/Chest'

const ROCK_KEYS = [
  'rock1_1', 'rock1_2', 'rock2_1', 'rock2_2', 'rock3_1', 'rock3_2',
]

export class GameScene extends Phaser.Scene {
  player!: Player
  enemies!: Phaser.Physics.Arcade.Group
  rocks!: Phaser.Physics.Arcade.StaticGroup
  waveManager!: WaveManager
  xpSystem!: XPSystem
  upgradeTracker!: UpgradeTracker
  pickups!: Phaser.GameObjects.Group
  chests!: Phaser.GameObjects.Group
  gameTime = 0
  private enemyHpBars!: Phaser.GameObjects.Graphics
  private gameOver = false
  private selectedHero: HeroType = 'ignara'
  protected terrainRT!: Phaser.GameObjects.RenderTexture
  private terrainTmpTile!: Phaser.GameObjects.Image | null

  constructor(config?: Phaser.Types.Scenes.SettingsConfig) {
    super(config ?? { key: 'GameScene' })
  }

  preload() {
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

    // Monster enemy spritesheets (150x150 frames, side-view — mushroom/flyingeye still used by SandGolem/FlyingEye)
    ss('mushroom_attack', 'assets/mushroom/Attack3.png', 150, 150)
    ss('flyingeye_attack', 'assets/flying_eye/Attack3.png', 150, 150)

    // Orc enemies (64x64 top-down, 4 directional rows — we use row 0)
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

    // Load only the selected hero's spritesheets (not all 7)
    const hero = (this.scene.settings.data as any)?.hero || 'ignara'
    this.loadHeroAssets(hero)

    // (Skeleton2 removed — replaced by Orc3 above)

    // Vampire enemy (32x32 frames)
    ss('vampire_idle',   'assets/vampire/idle.png',   32, 32)
    ss('vampire_run',    'assets/vampire/run.png',    32, 32)
    ss('vampire_attack', 'assets/vampire/attack.png', 32, 32)
    ss('vampire_hurt',   'assets/vampire/hurt.png',   32, 32)
    ss('vampire_death',  'assets/vampire/death.png',  32, 32)

    // Boss demon slime (288x160 frames, 22 cols x 5 rows)
    ss('boss_demon', 'assets/boss_demon/spritesheet.png', 288, 160)

    // VFX spritesheets
    ss('vfx_flame', 'assets/vfx/flamethrower_sheet.png', 64, 24)

    // Skill icons spritesheet (128x128 per icon, 10 columns, 10 rows = 100 icons)
    ss('skill_icons', 'assets/icons/skill_icons_sheet.png', 128, 128)

    // Rock images
    img('rock1_1', 'assets/rocks/Rock1_1_no_shadow.png')
    img('rock1_2', 'assets/rocks/Rock1_2_no_shadow.png')
    img('rock2_1', 'assets/rocks/Rock2_1_no_shadow.png')
    img('rock2_2', 'assets/rocks/Rock2_2_no_shadow.png')
    img('rock3_1', 'assets/rocks/Rock3_1_no_shadow.png')
    img('rock3_2', 'assets/rocks/Rock3_2_no_shadow.png')

    // Terrain tilesets
    ss('terrain_grass', 'assets/terrain/TX Tileset Grass.png', 32, 32)
    ss('terrain_stone', 'assets/terrain/TX Tileset Stone Ground.png', 32, 32)
    img('deco_tree1', 'assets/terrain/tree1.png')
    img('deco_tree2', 'assets/terrain/tree2.png')
    img('deco_tree3', 'assets/terrain/tree3.png')

    // Prop images for zone decorations (only files that exist in props/)
    img('prop_grass_tuft1', 'assets/props/grass_tuft1.png')
    img('prop_grass_tuft3', 'assets/props/grass_tuft3.png')
  }

  protected loadHeroAssets(hero: string) {
    const ss = (key: string, path: string, fw: number, fh: number) => {
      if (!this.textures.exists(key)) {
        this.load.spritesheet(key, path, { frameWidth: fw, frameHeight: fh })
      }
    }
    switch (hero) {
      case 'ignara':
        ss('ignara_idle', 'assets/ignara/Idle.png', 150, 150)
        ss('ignara_run', 'assets/ignara/Move.png', 150, 150)
        ss('ignara_attack', 'assets/ignara/Attack.png', 150, 150)
        ss('ignara_hurt', 'assets/ignara/Take Hit.png', 150, 150)
        ss('ignara_death', 'assets/ignara/Death.png', 150, 150)
        break
      case 'sifra':
        ss('sifra_idle', 'assets/sifra/Idle.png', 231, 190)
        ss('sifra_run', 'assets/sifra/Run.png', 231, 190)
        ss('sifra_attack', 'assets/sifra/Attack1.png', 231, 190)
        ss('sifra_attack2', 'assets/sifra/Attack2.png', 231, 190)
        ss('sifra_hurt', 'assets/sifra/Hit.png', 231, 190)
        ss('sifra_death', 'assets/sifra/Death.png', 231, 190)
        break
      case 'nazar':
        ss('nazar_idle', 'assets/nazar/Idle.png', 200, 200)
        ss('nazar_run', 'assets/nazar/Run.png', 200, 200)
        ss('nazar_attack', 'assets/nazar/Attack1.png', 200, 200)
        ss('nazar_attack2', 'assets/nazar/Attack2.png', 200, 200)
        ss('nazar_hurt', 'assets/nazar/Take Hit.png', 200, 200)
        ss('nazar_death', 'assets/nazar/Death.png', 200, 200)
        break
      case 'amun':
        ss('amun_idle', 'assets/amun/Idle.png', 160, 111)
        ss('amun_run', 'assets/amun/Run.png', 160, 111)
        ss('amun_attack', 'assets/amun/Attack1.png', 160, 111)
        ss('amun_attack2', 'assets/amun/Attack2.png', 160, 111)
        ss('amun_attack3', 'assets/amun/Attack3.png', 160, 111)
        ss('amun_hurt', 'assets/amun/Take Hit.png', 160, 111)
        ss('amun_death', 'assets/amun/Death.png', 160, 111)
        break
      case 'huntress':
        ss('huntress_idle', 'assets/lyra/Idle.png', 150, 150)
        ss('huntress_run', 'assets/lyra/Run.png', 150, 150)
        ss('huntress_attack', 'assets/lyra/Attack1.png', 150, 150)
        ss('huntress_attack2', 'assets/lyra/Attack2.png', 150, 150)
        ss('huntress_ranged', 'assets/lyra/Attack3.png', 150, 150)
        ss('huntress_hurt', 'assets/lyra/Take hit.png', 150, 150)
        ss('huntress_death', 'assets/lyra/Death.png', 150, 150)
        break
      case 'khashin':
        ss('khashin_idle', 'assets/khashin/Idle.png', 288, 128)
        ss('khashin_run', 'assets/khashin/Run.png', 288, 128)
        ss('khashin_attack', 'assets/khashin/Attack.png', 288, 128)
        ss('khashin_air_attack', 'assets/khashin/Air_attack.png', 288, 128)
        ss('khashin_special', 'assets/khashin/Special.png', 288, 128)
        ss('khashin_hurt', 'assets/khashin/Take_hit.png', 288, 128)
        ss('khashin_death', 'assets/khashin/Death.png', 288, 128)
        break
      case 'muller':
        ss('muller_idle', 'assets/givi/Idle.png', 288, 128)
        ss('muller_run', 'assets/givi/Run.png', 288, 128)
        ss('muller_attack', 'assets/givi/Attack.png', 288, 128)
        ss('muller_ground_slam', 'assets/givi/Ground_slam.png', 288, 128)
        ss('muller_special', 'assets/givi/Special.png', 288, 128)
        ss('muller_hurt', 'assets/givi/Take_hit.png', 288, 128)
        ss('muller_death', 'assets/givi/Death.png', 288, 128)
        // Crystal VFX sprites
        ss('crystal_green_0', 'assets/givi/crystal_green_0.png', 75, 78)
        ss('crystal_green_1', 'assets/givi/crystal_green_1.png', 65, 41)
        ss('crystal_pink_0', 'assets/givi/crystal_pink_0.png', 63, 61)
        ss('crystal_pink_1', 'assets/givi/crystal_pink_1.png', 30, 21)
        ss('crystal_blue_0', 'assets/givi/crystal_blue_0.png', 54, 51)
        ss('crystal_blue_1', 'assets/givi/crystal_blue_1.png', 43, 27)
        break
    }
  }

  create(data?: { hero?: HeroType }) {
    this.gameOver = false
    this.gameTime = 0
    this.selectedHero = data?.hero || 'ignara'

    // ── Pack 1: Immediate — what the player sees first frame ──
    this.generateVfxTextures()

    // VFX animations
    if (!this.anims.exists('flame_loop')) {
      this.anims.create({ key: 'flame_loop', frames: this.anims.generateFrameNumbers('vfx_flame', { start: 0, end: 3 }), frameRate: 12, repeat: -1 })
      this.anims.create({ key: 'flame_burst', frames: this.anims.generateFrameNumbers('vfx_flame', { start: 4, end: 4 }), frameRate: 8, repeat: 0 })
    }

    Orc1.createAnimations(this)
    Orc2.createAnimations(this)
    Orc3.createAnimations(this)
    Vampire.createAnimations(this)
    Player.createAnimations(this)

    this.physics.world.setBounds(0, 0, CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT)
    this.rocks = this.physics.add.staticGroup()

    // Terrain: fill base color instantly, defer all chunk drawing
    this.terrainRT = this.add.renderTexture(0, 0, CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT).setOrigin(0).setDepth(0)
    this.terrainRT.fill(0x4a7c3f)

    // Player at center
    this.player = new Player(this, CONFIG.WORLD_WIDTH / 2, CONFIG.WORLD_HEIGHT / 2, this.selectedHero)

    // Collide player with rocks and trees
    this.physics.add.collider(this.player, this.rocks)
    // Camera
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setBounds(0, 0, CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT)

    // ── Pack 2: Next frame — mid-range terrain + decorations ──
    this.time.delayedCall(1, () => {
      this.drawTerrainChunk(1)
      this.scatterDecorations(0, 1800)
      this.scatterRocks(0, 1800)

      // ── Pack 3: Deferred — far terrain + outer decorations ──
      this.time.delayedCall(1, () => {
        this.drawTerrainChunk(2)
        this.generateGraveTextures()
        this.scatterDecorations(1800, Infinity)
        this.scatterRocks(1800, Infinity)
      })
    })

    // Enemies group
    this.enemies = this.physics.add.group({ runChildUpdate: false })

    // Single batched graphics for all enemy HP bars
    this.enemyHpBars = this.add.graphics().setDepth(6)

    // Enemies collide with rocks — FlyingEye skips (it flies over obstacles)
    this.physics.add.collider(this.enemies, this.rocks, undefined, (enemy) => {
      return !(enemy as any).isFlying
    })

    // XP system
    this.xpSystem = new XPSystem(this, this.player)

    // Pickups group (HP orbs, magnets)
    this.pickups = this.add.group()

    // Chests scattered around the map
    this.chests = this.add.group()
    this.spawnChests()

    // Wave manager
    this.waveManager = new WaveManager(this, this.player, this.enemies)

    // Touch controls — virtual joystick on mobile, tap-to-move on desktop
    this.setupTouchControls()

    // Events
    this.events.on('enemy-died', (x: number, y: number, xpValue: number) => {
      this.xpSystem.spawnOrb(x, y, xpValue)
      this.player.kills++
      this.waveManager.onEnemyKilled()
      this.spawnGrave(x, y)

      // Huntress kill-triggered mechanics
      if (this.player.heroType === 'huntress') {
        const now = this.time.now
        // Battle Frenzy: +10% attack speed for 5s
        if (this.player.hasBattleFrenzy) {
          this.player.battleFrenzyUntil = now + 5000
        }
        // Kill Stride: +20% speed for 3s
        if (this.player.hasKillStride && this.player.killStrideUntil <= now) {
          this.player.speed = Math.ceil(this.player.speed * 1.2)
          this.player.killStrideUntil = now + 3000
        } else if (this.player.hasKillStride) {
          // Refresh timer
          this.player.killStrideUntil = now + 3000
        }
        // Camouflage: invisible for 2s
        if (this.player.hasCamouflage) {
          this.player.camouflageUntil = now + 2000
          this.player.setAlpha(0.3)
        }
      }

      // Khashin kill-triggered mechanics
      if (this.player.heroType === 'khashin') {
        // Scarab Tide: 4 seeking scarabs that blind nearby enemies
        if (this.player.hasScarabTide) {
          for (let i = 0; i < 4; i++) {
            const sa = (i / 4) * Math.PI * 2
            const scarab = this.add.circle(x, y, 3, 0xddaa44, 0.7).setDepth(10)
            // Find nearest unblinded enemy
            let target: Phaser.Physics.Arcade.Sprite | null = null
            let nearDist = 150
            for (const e of this.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
              if (!e.active || (e as any)._isBlinded) continue
              const d = Phaser.Math.Distance.Between(x, y, e.x, e.y)
              if (d < nearDist) { nearDist = d; target = e }
            }
            if (target) {
              const t = target
              this.tweens.add({
                targets: scarab, x: t.x, y: t.y, duration: 300, delay: i * 50,
                onComplete: () => {
                  scarab.destroy()
                  if (t.active) {
                    ;(t as any)._isBlinded = true
                    ;(t as any)._blindExpires = this.time.now + 1500
                    ;(t as any).speed = (t as any).baseSpeed * 0.6
                    t.setTint(0xddaa44)
                    if (!(t as any)._blindTimer) {
                      const scene = this
                      const chk = () => {
                        if (!t.active) { (t as any)._blindTimer = null; return }
                        if (scene.time.now >= (t as any)._blindExpires) {
                          t.clearTint(); (t as any)._isBlinded = false; (t as any)._blindTimer = null
                          if ((t as any).baseSpeed) (t as any).speed = (t as any).baseSpeed
                        } else { (t as any)._blindTimer = scene.time.delayedCall(200, chk) }
                      }
                      ;(t as any)._blindTimer = scene.time.delayedCall(200, chk)
                    }
                  }
                },
              })
            } else {
              // No target, just fly out
              this.tweens.add({
                targets: scarab,
                x: x + Math.cos(sa) * 60, y: y + Math.sin(sa) * 60,
                alpha: 0, duration: 400, delay: i * 50,
                onComplete: () => scarab.destroy(),
              })
            }
          }
        }
      }

      // Crystal Muller kill-triggered mechanics
      if (this.player.heroType === 'muller') {
        // Stone Skin: +1 DR stack on kill, +5% scale, -2% speed per stack
        if (this.player.hasStoneSkin && this.player.stoneSkinStacks < 5) {
          this.player.stoneSkinStacks++
          this.player.stoneSkinTimer = 0
          // Scale hero up
          this.player.applyStoneSkinVisuals()
          // Proc VFX — stone dust ring
          const ring = this.add.circle(this.player.cx, this.player.cy, 8, 0x99ddcc, 0.6).setDepth(12)
          this.tweens.add({ targets: ring, scale: 3, alpha: 0, duration: 300, onComplete: () => ring.destroy() })
        }
      }

      // Ignara kill-triggered mechanics
      if (this.player.heroType === 'ignara' && this.player.hasPyromaniac) {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 5)
      }

      // Heart drop with progressive thresholds: 100, 300, 500, then every 500
      const kills = this.player.kills
      const heartThresholds = [100, 300, 500]
      const isThreshold = heartThresholds.includes(kills) || (kills > 500 && kills % 500 === 0)
      if (isThreshold) {
        const heart = new Pickup(this, x, y, 'heart', this.player)
        this.pickups.add(heart)
      }

      // Drop table — weighted random drops
      const tier = this.waveManager.currentWave
      const roll = Math.random()
      let dropType: PickupType | null = null
      if (roll < 0.08) dropType = 'hp'
      else if (roll < 0.10) dropType = 'magnet'
      else if (roll < 0.11 && tier >= 3) dropType = 'bomb'
      else if (roll < 0.115 && tier >= 4) dropType = 'shield'
      else if (roll < 0.12 && tier >= 2) dropType = 'speed'
      else if (roll < 0.125 && tier >= 5) dropType = 'xpstar'
      if (dropType) {
        const pickup = new Pickup(this, x, y, dropType, this.player)
        this.pickups.add(pickup)
      }
    })

    // Pickup overlap — collect on touch
    this.physics.add.overlap(this.player, this.pickups, (_player, pickup) => {
      (pickup as Pickup).collect()
    })

    // Chest overlap — open on touch
    this.physics.add.overlap(this.player, this.chests, (_player, chest) => {
      (chest as Chest).open()
    })

    // Magnet pickup — pull all XP orbs to player instantly
    this.events.on('magnet-activated', () => {
      const orbs = this.xpSystem.getOrbs().getChildren() as Phaser.Physics.Arcade.Sprite[]
      for (const orb of orbs) {
        if (!orb.active) continue
        this.tweens.add({
          targets: orb,
          x: this.player.cx, y: this.player.cy,
          duration: 300,
          onComplete: () => {
            if (orb.active) {
              this.player.addXP((orb as any).xpValue || 10)
              orb.destroy()
            }
          },
        })
      }
    })

    this.upgradeTracker = new UpgradeTracker()

    this.events.on('player-levelup', () => {
      // Kill nearby enemies so player can safely choose upgrades
      const CLEAR_RADIUS = 200
      const px = this.player.cx
      const py = this.player.cy
      for (const enemy of this.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!enemy.active) continue
        const dist = Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y)
        if (dist < CLEAR_RADIUS && typeof (enemy as any).die === 'function') {
          (enemy as any).die()
        }
      }
      const choices = this.upgradeTracker.getChoices(this.player.heroType, this.player.getActiveStance())
      if (choices.length === 0) return  // all upgrades taken — skip level-up UI
      this.scene.launch('LevelUpScene', { player: this.player, tracker: this.upgradeTracker, callerSceneKey: this.scene.key })
      this.scene.pause()
    })

    this.events.on('player-died', () => {
      this.gameOver = true
    })

    // CLAWS boss at 10 minutes
    this.events.on('claws-incoming', () => {
      this.scene.get('UIScene').events.emit('claws-warning')
    })

    this.events.once('claws-spawn', () => {
      this.spawnClawsBoss()
    })

    // Start UI
    this.scene.launch('UIScene', { gameScene: this })

    // Start spawning after brief delay
    this.time.delayedCall(2000, () => {
      this.waveManager.start()
    })
  }

  /** Returns the biome zone (0-4) for a world pixel position. */
  public getZone(px: number, py: number): number {
    const cx = CONFIG.WORLD_WIDTH / 2
    const cy = CONFIG.WORLD_HEIGHT / 2
    const dist = Phaser.Math.Distance.Between(px, py, cx, cy)
    if (dist < 600) return 0
    if (dist < 1200) return 1
    if (dist < 1800) return 2
    if (dist < 2400) return 3
    return 4
  }

  // Draw terrain in chunks: 0=center(~800px), 1=mid(800-1600px), 2=outer(rest)
  protected drawTerrainChunk(pack: number) {
    const tileSize = CONFIG.TILE_SIZE
    const cx = CONFIG.WORLD_WIDTH / 2
    const cy = CONFIG.WORLD_HEIGHT / 2

    const rng = (x: number, y: number, salt: number) => {
      const n = Math.sin(x * 127.1 + y * 311.7 + salt * 42) * 43758.5453
      return n - Math.floor(n)
    }

    const GRASS_FRAMES = [4, 5, 6, 7, 12, 13, 14, 15, 20, 21, 22, 23, 28, 29, 30, 31]

    const cols = Math.ceil(CONFIG.WORLD_WIDTH / tileSize)
    const rows = Math.ceil(CONFIG.WORLD_HEIGHT / tileSize)

    // Distance ranges per pack (pack 0 skipped — base fill covers it)
    const ranges: [number, number][] = [[0, 0], [0, 1600], [1600, Infinity]]
    const [minDist, maxDist] = ranges[pack]

    if (!this.terrainTmpTile) {
      this.terrainTmpTile = this.add.image(0, 0, 'terrain_grass', 0).setScale(2).setVisible(false)
    }
    const tmpTile = this.terrainTmpTile

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const px = c * tileSize + tileSize / 2
        const py = r * tileSize + tileSize / 2
        const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2)
        if (dist < minDist || dist >= maxDist) continue

        const zone = this.getZone(px, py)
        const rand = rng(c, r, 3)
        const grassFrame = GRASS_FRAMES[Math.floor(rand * GRASS_FRAMES.length)]
        tmpTile.setFrame(grassFrame).setPosition(px, py)

        if (zone === 3) tmpTile.setTint(0xccddcc)
        else if (zone === 4) tmpTile.setTint(0xbbccbb)
        else tmpTile.clearTint()

        this.terrainRT.draw(tmpTile)
      }
    }

    // Destroy temp tile after last pack
    if (pack === 2 && this.terrainTmpTile) {
      this.terrainTmpTile.destroy()
      this.terrainTmpTile = null
    }
  }

  protected treePositions: { x: number; y: number }[] = []

  private _rockPlaced: { x: number; y: number }[] = []

  private scatterRocks(filterMin = 0, filterMax = Infinity) {
    const centerX = CONFIG.WORLD_WIDTH / 2
    const centerY = CONFIG.WORLD_HEIGHT / 2
    const MIN_ROCK_DIST = 120
    const MIN_TREE_DIST = 100
    const MAX_ATTEMPTS = 60

    const zoneRockCounts = [
      Phaser.Math.Between(2, 3),
      Phaser.Math.Between(8, 10),
      Phaser.Math.Between(10, 12),
      Phaser.Math.Between(8, 10),
      Phaser.Math.Between(10, 12),
    ]
    const zoneRanges: [number, number][] = [
      [200, 590], [620, 1180], [1220, 1780], [1820, 2380],
      [2420, Math.sqrt(2) * (CONFIG.WORLD_WIDTH / 2) - 80],
    ]

    for (let zone = 0; zone < 5; zone++) {
      const [zMin, zMax] = zoneRanges[zone]
      // Skip zones outside the requested distance range
      if (zMax < filterMin || zMin >= filterMax) continue

      const count = zoneRockCounts[zone]
      for (let i = 0; i < count; i++) {
        let x = 0, y = 0, valid = false
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
          const angle = Math.random() * Math.PI * 2
          const dist = Phaser.Math.FloatBetween(zMin, zMax)
          x = centerX + Math.cos(angle) * dist
          y = centerY + Math.sin(angle) * dist
          if (x < 80 || x > CONFIG.WORLD_WIDTH - 80 || y < 80 || y > CONFIG.WORLD_HEIGHT - 80) continue
          if (this._rockPlaced.some(p => Phaser.Math.Distance.Between(x, y, p.x, p.y) < MIN_ROCK_DIST)) continue
          if (this.treePositions.some(t => Phaser.Math.Distance.Between(x, y, t.x, t.y) < MIN_TREE_DIST)) continue
          valid = true; break
        }
        if (!valid) continue
        this._rockPlaced.push({ x, y })
        const key = ROCK_KEYS[Phaser.Math.Between(0, ROCK_KEYS.length - 1)]
        const rock = this.rocks.create(x, y, key) as Phaser.Physics.Arcade.Sprite
        rock.setDepth(2).setScale(Phaser.Math.FloatBetween(0.6, 1.2))
        rock.refreshBody()
        const body = rock.body as Phaser.Physics.Arcade.StaticBody
        const dw = rock.displayWidth, dh = rock.displayHeight, sc = rock.scaleX
        body.setSize(dw * 0.45, dh * 0.4)
        body.setOffset((rock.width - dw * 0.45 / sc) / 2, (rock.height - dh * 0.4 / sc) / 2)
      }
    }
  }

  private _decoPlaced: { x: number; y: number }[] = []

  protected scatterDecorations(filterMin = 0, filterMax = Infinity) {
    const centerX = CONFIG.WORLD_WIDTH / 2
    const centerY = CONFIG.WORLD_HEIGHT / 2

    const MIN_DIST = 110
    const MAX_ATTEMPTS = 60

    const tryPlace = (minR: number, maxR: number): { x: number; y: number } | null => {
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const angle = Math.random() * Math.PI * 2
        const dist = Phaser.Math.FloatBetween(minR, maxR)
        const x = centerX + Math.cos(angle) * dist
        const y = centerY + Math.sin(angle) * dist
        if (x < 80 || x > CONFIG.WORLD_WIDTH - 80 || y < 80 || y > CONFIG.WORLD_HEIGHT - 80) continue
        if (this._decoPlaced.some(p => Phaser.Math.Distance.Between(x, y, p.x, p.y) < MIN_DIST)) continue
        return { x, y }
      }
      return null
    }

    const addProp = (x: number, y: number, key: string, tint?: number) => {
      this._decoPlaced.push({ x, y })
      this.treePositions.push({ x, y })
      const img = this.add.image(x, y, key).setDepth(3)
      if (tint !== undefined) img.setTint(tint)
    }

    const treeKeys = ['deco_tree1', 'deco_tree2', 'deco_tree3']
    const tuftKeys = ['prop_grass_tuft1', 'prop_grass_tuft3']
    const pick = (arr: string[]) => arr[Phaser.Math.Between(0, arr.length - 1)]

    // Zone definitions: [zoneMinR, zoneMaxR, trees, tufts, tint?]
    const zones: [number, number, number, number, number?][] = [
      [80, 550, 0, Phaser.Math.Between(4, 6)],
      [620, 1180, Phaser.Math.Between(15, 20), Phaser.Math.Between(12, 18)],
      [1220, 1780, Phaser.Math.Between(10, 15), Phaser.Math.Between(8, 12)],
      [1820, 2380, Phaser.Math.Between(25, 35), Phaser.Math.Between(10, 16), 0xccddcc],
      [2420, Math.sqrt(2) * (CONFIG.WORLD_WIDTH / 2) - 100, 0, Phaser.Math.Between(6, 10), 0xbbccbb],
    ]

    for (const [zMin, zMax, trees, tufts, tint] of zones) {
      if (zMax < filterMin || zMin >= filterMax) continue
      for (let i = 0; i < trees; i++) {
        const p = tryPlace(zMin, zMax)
        if (p) addProp(p.x, p.y, pick(treeKeys), tint)
      }
      for (let i = 0; i < tufts; i++) {
        const p = tryPlace(zMin, zMax)
        if (p) addProp(p.x, p.y, pick(tuftKeys), tint)
      }
    }
  }

  private setupTouchControls() {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      || (navigator.maxTouchPoints > 1)

    if (!isMobile) {
      // Desktop: tap-to-move
      this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        this.player.setTouchTarget(pointer.worldX, pointer.worldY)
      })
      this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        if (pointer.isDown) {
          this.player.setTouchTarget(pointer.worldX, pointer.worldY)
        }
      })
      return
    }

    // Mobile: virtual joystick (left side of screen)
    const JOYSTICK_RADIUS = 50
    const KNOB_RADIUS = 22
    const DEAD_ZONE = 8

    // UI scene overlay for joystick (fixed to camera)
    const joyBase = this.add.graphics().setDepth(100).setScrollFactor(0)
    const joyKnob = this.add.graphics().setDepth(101).setScrollFactor(0)
    let joyOrigin: { x: number; y: number } | null = null
    let activePointerId = -1

    const drawBase = (x: number, y: number) => {
      joyBase.clear()
      joyBase.fillStyle(0xffffff, 0.08)
      joyBase.fillCircle(x, y, JOYSTICK_RADIUS)
      joyBase.lineStyle(2, 0xffffff, 0.2)
      joyBase.strokeCircle(x, y, JOYSTICK_RADIUS)
    }

    const drawKnob = (x: number, y: number) => {
      joyKnob.clear()
      joyKnob.fillStyle(0xffffff, 0.3)
      joyKnob.fillCircle(x, y, KNOB_RADIUS)
    }

    const hideJoystick = () => {
      joyBase.clear()
      joyKnob.clear()
      joyOrigin = null
      activePointerId = -1
      this.player.clearJoystick()
    }

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Only use left half of screen for joystick
      if (pointer.x < this.scale.width * 0.5 && activePointerId === -1) {
        joyOrigin = { x: pointer.x, y: pointer.y }
        activePointerId = pointer.id
        drawBase(pointer.x, pointer.y)
        drawKnob(pointer.x, pointer.y)
      }
    })

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id !== activePointerId || !joyOrigin) return
      if (!pointer.isDown) { hideJoystick(); return }

      let dx = pointer.x - joyOrigin.x
      let dy = pointer.y - joyOrigin.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < DEAD_ZONE) {
        drawKnob(joyOrigin.x, joyOrigin.y)
        this.player.clearJoystick()
        return
      }

      // Clamp knob to radius
      const clampDist = Math.min(dist, JOYSTICK_RADIUS)
      const nx = dx / dist
      const ny = dy / dist
      const knobX = joyOrigin.x + nx * clampDist
      const knobY = joyOrigin.y + ny * clampDist

      drawKnob(knobX, knobY)
      this.player.setJoystickDirection(nx, ny)
    })

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === activePointerId) {
        hideJoystick()
      }
    })
  }

  private generateVfxTextures() {
    // Flame blob — soft radial gradient circle (16x16)
    const fb = this.add.graphics({ x: 0, y: 0 }).setVisible(false)
    fb.fillStyle(0xffffff, 1)
    fb.fillCircle(8, 8, 8)
    fb.fillStyle(0xffffff, 0.6)
    fb.fillCircle(8, 8, 5)
    fb.generateTexture('vfx_flame', 16, 16)
    fb.destroy()

    // Smoke puff — soft gray (12x12)
    const sp = this.add.graphics({ x: 0, y: 0 }).setVisible(false)
    sp.fillStyle(0x888888, 0.7)
    sp.fillCircle(6, 6, 6)
    sp.fillStyle(0xaaaaaa, 0.3)
    sp.fillCircle(6, 6, 3)
    sp.generateTexture('vfx_smoke', 12, 12)
    sp.destroy()

    // Spark — tiny bright dot (4x4)
    const sk = this.add.graphics({ x: 0, y: 0 }).setVisible(false)
    sk.fillStyle(0xffffff, 1)
    sk.fillCircle(2, 2, 2)
    sk.generateTexture('vfx_spark', 4, 4)
    sk.destroy()

    // Slash arc — crescent shape for dash attacks (32x32)
    if (!this.textures.exists('vfx_slash')) {
      const sl = this.add.graphics({ x: 0, y: 0 }).setVisible(false)
      // Outer arc
      sl.fillStyle(0xffffff, 0.9)
      sl.slice(16, 16, 14, Phaser.Math.DegToRad(-60), Phaser.Math.DegToRad(60), false)
      sl.fillPath()
      // Inner cutout (dark)
      sl.fillStyle(0x000000, 1)
      sl.fillCircle(16, 16, 8)
      // Bright edge highlight
      sl.lineStyle(2, 0xccddff, 0.9)
      sl.arc(16, 16, 13, Phaser.Math.DegToRad(-55), Phaser.Math.DegToRad(55))
      sl.strokePath()
      sl.generateTexture('vfx_slash', 32, 32)
      sl.destroy()
    }

    // Ice shard — diamond crystal (16x24)
    if (!this.textures.exists('vfx_iceshard')) {
      const ic = this.add.graphics({ x: 0, y: 0 }).setVisible(false)
      // Outer glow
      ic.fillStyle(0x44aaff, 0.3)
      ic.fillCircle(8, 12, 10)
      // Crystal body
      ic.fillStyle(0x88ddff, 0.9)
      ic.fillTriangle(8, 0, 2, 12, 14, 12)  // top half
      ic.fillTriangle(8, 24, 2, 12, 14, 12) // bottom half
      // Inner bright core
      ic.fillStyle(0xccf0ff, 0.7)
      ic.fillTriangle(8, 4, 5, 12, 11, 12)
      // Bright center line
      ic.lineStyle(1, 0xffffff, 0.8)
      ic.lineBetween(8, 2, 8, 22)
      ic.generateTexture('vfx_iceshard', 16, 24)
      ic.destroy()
    }

    // Frost particle — small ice sparkle (6x6)
    if (!this.textures.exists('vfx_frost')) {
      const fr = this.add.graphics({ x: 0, y: 0 }).setVisible(false)
      fr.fillStyle(0xaaddff, 0.8)
      fr.fillCircle(3, 3, 3)
      fr.fillStyle(0xffffff, 0.6)
      fr.fillCircle(3, 3, 1.5)
      fr.generateTexture('vfx_frost', 6, 6)
      fr.destroy()
    }

    // Shockwave ring — donut shape (48x48)
    if (!this.textures.exists('vfx_shockring')) {
      const sr = this.add.graphics({ x: 0, y: 0 }).setVisible(false)
      // Outer ring glow
      sr.fillStyle(0xffee44, 0.3)
      sr.fillCircle(24, 24, 23)
      // Ring body
      sr.lineStyle(4, 0xfff200, 0.9)
      sr.strokeCircle(24, 24, 18)
      // Inner bright ring
      sr.lineStyle(2, 0xffffaa, 0.7)
      sr.strokeCircle(24, 24, 16)
      // Clear center
      sr.fillStyle(0x000000, 1)
      sr.fillCircle(24, 24, 12)
      sr.generateTexture('vfx_shockring', 48, 48)
      sr.destroy()
    }

    // Hit spark — starburst (16x16)
    if (!this.textures.exists('vfx_hitspark')) {
      const hs = this.add.graphics({ x: 0, y: 0 }).setVisible(false)
      // Central glow
      hs.fillStyle(0xffffff, 0.9)
      hs.fillCircle(8, 8, 4)
      // Rays
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        hs.lineStyle(2, 0xffffcc, 0.8)
        hs.lineBetween(
          8 + Math.cos(a) * 3, 8 + Math.sin(a) * 3,
          8 + Math.cos(a) * 7, 8 + Math.sin(a) * 7
        )
      }
      hs.generateTexture('vfx_hitspark', 16, 16)
      hs.destroy()
    }

    // Level-up starburst (32x32)
    if (!this.textures.exists('vfx_levelup')) {
      const lu = this.add.graphics({ x: 0, y: 0 }).setVisible(false)
      lu.fillStyle(0xffd700, 0.6)
      lu.fillCircle(16, 16, 14)
      lu.fillStyle(0xffffff, 0.4)
      lu.fillCircle(16, 16, 8)
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        lu.lineStyle(2, 0xffd700, 0.9)
        lu.lineBetween(
          16 + Math.cos(a) * 6, 16 + Math.sin(a) * 6,
          16 + Math.cos(a) * 15, 16 + Math.sin(a) * 15
        )
      }
      lu.generateTexture('vfx_levelup', 32, 32)
      lu.destroy()
    }

    // Lightning bolt spritesheet — 6 frames of animated jagged bolts with glow (64x32 per frame)
    if (!this.textures.exists('vfx_lightning_sheet')) {
      const FW = 64, FH = 32, FRAMES = 6
      const lb = this.add.graphics({ x: 0, y: 0 }).setVisible(false)

      for (let f = 0; f < FRAMES; f++) {
        const ox = f * FW
        const cy = FH / 2

        // Outer glow — tapers to a point at the end
        lb.fillStyle(0x3355cc, 0.12)
        lb.fillTriangle(ox, cy - 2, ox, cy + 2, ox + FW * 0.7, cy)
        lb.fillStyle(0x5577ee, 0.08)
        lb.fillTriangle(ox + 2, cy - 6, ox + 2, cy + 6, ox + FW * 0.85, cy)

        // Draw 2 main bolts — thickness & alpha taper toward end
        const seed = f * 137
        const segments = 7
        const segLen = (FW - 6) / segments

        for (let b = 0; b < 2; b++) {
          const baseThick = b === 0 ? 3.5 : 2
          const baseAlpha = b === 0 ? 0.95 : 0.55
          const color = b === 0 ? 0xffffff : 0x99bbff

          // Draw segment by segment with decreasing thickness
          let bx = ox + 3
          let by = cy + (b === 0 ? 0 : 2)
          for (let s = 0; s < segments; s++) {
            const t = s / (segments - 1) // 0 → 1 (start → end)
            const thick = baseThick * (1 - t * 0.85) // taper to ~15% at tip
            const alpha = baseAlpha * (1 - t * 0.7)  // fade to ~30% at tip
            const jitterAmt = 16 * (1 - t * 0.5)     // less jitter at tip
            const jitter = ((((seed + s * 73 + b * 31) % 17) / 17) - 0.5) * jitterAmt

            const nx = bx + segLen
            const ny = cy + jitter * (1 - t * 0.3)

            lb.lineStyle(Math.max(0.5, thick), color, alpha)
            lb.beginPath()
            lb.moveTo(bx, by)
            lb.lineTo(nx, ny)
            lb.strokePath()

            // Glow pass per segment — also tapers
            if (thick > 1) {
              lb.lineStyle(thick + 3 * (1 - t), 0x6688ff, 0.15 * (1 - t * 0.8))
              lb.beginPath()
              lb.moveTo(bx, by)
              lb.lineTo(nx, ny)
              lb.strokePath()
            }

            bx = nx
            by = ny
          }
        }

        // Bright spark nodes — only in first 60% of bolt
        for (let n = 0; n < 3; n++) {
          const nx = ox + 8 + ((seed + n * 53) % Math.floor(FW * 0.55))
          const ny = cy + (((seed + n * 41) % 13) - 6)
          const sparkT = (nx - ox) / FW // 0→1 position along bolt
          const sparkAlpha = 0.9 * (1 - sparkT * 0.7)
          lb.fillStyle(0xffffff, sparkAlpha)
          lb.fillCircle(nx, ny, 2 * (1 - sparkT * 0.5))
          lb.fillStyle(0x88bbff, sparkAlpha * 0.4)
          lb.fillCircle(nx, ny, 4 * (1 - sparkT * 0.5))
        }
      }

      lb.generateTexture('vfx_lightning_sheet', FW * FRAMES, FH)
      lb.destroy()

      // Also create single-frame legacy texture for backward compat
      if (!this.textures.exists('vfx_lightning')) {
        const canvas = this.textures.createCanvas('vfx_lightning', FW, FH)!
        const src = this.textures.get('vfx_lightning_sheet').getSourceImage() as HTMLImageElement
        canvas.context.drawImage(src, 0, 0, FW, FH, 0, 0, FW, FH)
        canvas.refresh()
      }
    }

    // Lightning bolt animation
    if (!this.anims.exists('lightning_bolt_loop')) {
      this.load.once('complete', () => {
        // spritesheet already generated above
      })
      // Register spritesheet frames manually
      if (this.textures.exists('vfx_lightning_sheet')) {
        const tex = this.textures.get('vfx_lightning_sheet')
        for (let i = 0; i < 6; i++) {
          tex.add(i, 0, i * 64, 0, 64, 32)
        }
        this.anims.create({
          key: 'lightning_bolt_loop',
          frames: Array.from({ length: 6 }, (_, i) => ({ key: 'vfx_lightning_sheet', frame: i })),
          frameRate: 14,
          repeat: -1,
        })
      }
    }

    // Electric spark — bright + cross shape (8x8)
    if (!this.textures.exists('vfx_spark_elec')) {
      const se = this.add.graphics({ x: 0, y: 0 }).setVisible(false)
      // Cross shape
      se.fillStyle(0xffffff, 0.95)
      se.fillRect(2, 0, 4, 8)
      se.fillRect(0, 2, 8, 4)
      // Bright center
      se.fillStyle(0xddeeff, 0.7)
      se.fillCircle(4, 4, 3)
      se.generateTexture('vfx_spark_elec', 8, 8)
      se.destroy()
    }

  }

  private generateGraveTextures() {
    // Tombstone RIP — dark stone
    if (!this.textures.exists('grave_rip')) {
      const g = this.add.graphics()
      const w = 24, h = 28
      // Stone base
      g.fillStyle(0x2a2a22)
      g.fillRect(4, 22, 16, 6)
      // Tombstone body
      g.fillStyle(0x3d3d33)
      g.fillRoundedRect(6, 4, 12, 20, { tl: 5, tr: 5, bl: 1, br: 1 })
      // Highlight edge (top-left light)
      g.lineStyle(1, 0x555548)
      g.strokeRoundedRect(6, 4, 12, 20, { tl: 5, tr: 5, bl: 1, br: 1 })
      // Shadow inner edge
      g.lineStyle(1, 0x1a1a14, 0.6)
      g.lineBetween(17, 6, 17, 22)
      // RIP text
      g.fillStyle(0x111108)
      // R
      g.fillRect(8, 9, 1, 5)
      g.fillRect(9, 9, 2, 1)
      g.fillRect(10, 11, 1, 1)
      g.fillRect(9, 11, 2, 1)
      g.fillRect(10, 13, 1, 1)
      // I
      g.fillRect(12, 9, 1, 5)
      // P
      g.fillRect(14, 9, 1, 5)
      g.fillRect(15, 9, 2, 1)
      g.fillRect(16, 10, 1, 1)
      g.fillRect(15, 11, 2, 1)
      // Crack
      g.lineStyle(1, 0x1a1a14, 0.7)
      g.lineBetween(10, 15, 13, 19)
      g.generateTexture('grave_rip', w, h)
      g.destroy()
    }

    // Simple cross — dark wood
    if (!this.textures.exists('grave_cross')) {
      const g = this.add.graphics()
      const w = 20, h = 28
      // Ground mound (dark earth)
      g.fillStyle(0x2a2211, 0.7)
      g.fillEllipse(10, 25, 16, 6)
      // Cross vertical
      g.fillStyle(0x332b1a)
      g.fillRect(8, 4, 4, 22)
      // Cross horizontal
      g.fillRect(3, 9, 14, 3)
      // Highlight grain
      g.lineStyle(1, 0x44391f, 0.5)
      g.lineBetween(9, 6, 9, 24)
      g.lineBetween(5, 10, 15, 10)
      // Shadow side
      g.lineStyle(1, 0x1a1508, 0.6)
      g.lineBetween(11, 6, 11, 24)
      g.lineBetween(5, 11, 15, 11)
      g.generateTexture('grave_cross', w, h)
      g.destroy()
    }
  }

  private spawnGrave(x: number, y: number) {
    const key = Math.random() < 0.5 ? 'grave_rip' : 'grave_cross'
    const grave = this.add.image(x, y, key)
    grave.setDepth(1) // above terrain, below everything else
    grave.setScale(Phaser.Math.FloatBetween(0.9, 1.3))
    grave.setAngle(Phaser.Math.FloatBetween(-8, 8))

    // Fade in
    grave.setAlpha(0)
    this.tweens.add({
      targets: grave,
      alpha: 0.85,
      duration: 400,
    })
  }

  private spawnClawsBoss() {
    // Kill all remaining mobs
    for (const enemy of this.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (enemy.active) enemy.destroy()
    }

    // Create boss animations from demon slime spritesheet
    if (!this.anims.exists('boss_walk')) {
      // Mini spritesheet: idle(0-5), walk(6-17), cleave(18-32), hit(33-37), death(38-59)
      this.anims.create({ key: 'boss_idle', frames: this.anims.generateFrameNumbers('boss_demon', { start: 0, end: 5 }), frameRate: 8, repeat: -1 })
      this.anims.create({ key: 'boss_walk', frames: this.anims.generateFrameNumbers('boss_demon', { start: 6, end: 17 }), frameRate: 10, repeat: -1 })
      this.anims.create({ key: 'boss_cleave', frames: this.anims.generateFrameNumbers('boss_demon', { start: 18, end: 32 }), frameRate: 12, repeat: 0 })
      this.anims.create({ key: 'boss_hit', frames: this.anims.generateFrameNumbers('boss_demon', { start: 33, end: 37 }), frameRate: 8, repeat: 0 })
      this.anims.create({ key: 'boss_death', frames: this.anims.generateFrameNumbers('boss_demon', { start: 38, end: 59 }), frameRate: 10, repeat: 0 })
    }
    if (!this.anims.exists('boss_spawn')) {
      // Reverse death animation — frames 59 down to 38 — for materializing effect
      const spawnFrames: Phaser.Types.Animations.AnimationFrame[] = []
      for (let f = 59; f >= 38; f--) {
        spawnFrames.push({ key: 'boss_demon', frame: f })
      }
      this.anims.create({ key: 'boss_spawn', frames: spawnFrames, frameRate: 10, repeat: 0 })
    }

    // Spawn boss to the LEFT of the player
    const bx = Phaser.Math.Clamp(this.player.x - 400, 60, CONFIG.WORLD_WIDTH - 60)
    const by = Phaser.Math.Clamp(this.player.y, 60, CONFIG.WORLD_HEIGHT - 60)

    const boss = this.physics.add.sprite(bx, by, 'boss_demon')
    boss.setScale(3)
    boss.setDepth(15)
    boss.setBodySize(60, 50)
    boss.setOffset(114, 70)
    boss.setAlpha(0)
    ;(boss as any).hp = 9999
    ;(boss as any).maxHp = 9999
    ;(boss as any).bossSpawning = true

    // Shadow under boss
    const shadow = this.add.ellipse(boss.x, boss.y, 80, 24, 0x000000, 0.35).setDepth(14)

    // Spawn animation: reverse death (materializing effect) with alpha fade-in
    boss.play('boss_spawn')
    this.tweens.add({ targets: boss, alpha: 1, duration: 600, ease: 'Linear' })
    boss.once('animationcomplete', () => {
      if (!boss.active) return
      ;(boss as any).bossSpawning = false
      boss.play('boss_idle')
      // Brief idle pause before entering walk loop
      this.time.delayedCall(400, () => {
        if (boss.active) boss.play('boss_walk')
      })
    })

    // Boss cleave attack cooldown
    let cleaveCooldown = 0

    // Boss moves toward player, cleave attacks, kills on contact
    const bossTimer = this.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        if (!boss.active || this.gameOver) {
          bossTimer.destroy()
          return
        }
        // Wait for spawn animation to complete before acting
        if ((boss as any).bossSpawning) return
        this.physics.moveTo(boss, this.player.x, this.player.y, 100)
        boss.setFlipX(this.player.x < boss.x)
        shadow.setPosition(boss.x, (boss.body as Phaser.Physics.Arcade.Body).bottom)

        const dist = Phaser.Math.Distance.Between(boss.x, boss.y, this.player.x, this.player.y)

        // Contact = instant kill (check first, skip cleave if triggering)
        if (dist < 50) {
          this.player.takeDamage(99999)
          return
        }

        // Cleave attack when close
        cleaveCooldown -= 50
        if (dist < 130 && cleaveCooldown <= 0) {
          cleaveCooldown = 3000
          boss.play('boss_cleave')
          boss.once('animationcomplete', () => {
            if (boss.active) boss.play('boss_walk')
          })
          // Cleave damage — 30% maxHP
          this.player.takeDamage(Math.ceil(this.player.maxHp * 0.3))
          this.cameras.main.shake(200, 0.01)
        }
      },
    })
  }

  update(time: number, delta: number) {
    if (this.gameOver) return

    this.gameTime += delta

    this.player.update(time, delta)
    this.player.tryAutoAttack(this.enemies, time, delta)

    for (const enemy of this.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (enemy.active) {
        (enemy as Orc1 | Orc2 | Orc3 | FlyingEye | SandGolem).update(time, delta)
      }
    }

    // XP magnet pull
    this.xpSystem.updateMagnet()

    // Batched enemy HP bars
    this.enemyHpBars.clear()
    for (const enemy of this.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!enemy.active) continue
      const e = enemy as any
      if (e.hp === undefined || e.maxHp === undefined || e.hp >= e.maxHp) continue

      const barWidth = e.maxHp > 100 ? 40 : e.maxHp > 30 ? 30 : 24
      const barHeight = e.maxHp > 100 ? 5 : 3
      const barY = enemy.y - (e.maxHp > 100 ? 40 : e.maxHp > 30 ? 30 : 22)
      const barX = enemy.x - barWidth / 2

      this.enemyHpBars.fillStyle(0x333333)
      this.enemyHpBars.fillRect(barX, barY, barWidth, barHeight)

      const hpRatio = Math.max(0, e.hp / e.maxHp)
      const color = hpRatio > 0.5 ? 0x00ff00 : hpRatio > 0.25 ? 0xffff00 : 0xff0000
      this.enemyHpBars.fillStyle(color)
      this.enemyHpBars.fillRect(barX, barY, barWidth * hpRatio, barHeight)
    }
  }

  private spawnChests() {
    const cx = CONFIG.WORLD_WIDTH / 2, cy = CONFIG.WORLD_HEIGHT / 2
    // Common chests — scattered in mid-range
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.5
      const dist = Phaser.Math.Between(400, 1200)
      const x = cx + Math.cos(angle) * dist
      const y = cy + Math.sin(angle) * dist
      const chest = new Chest(this, x, y, 'common', this.player)
      this.chests.add(chest)
    }
    // Rare chests — further out
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 + Math.random() * 0.3
      const dist = Phaser.Math.Between(800, 1400)
      const x = cx + Math.cos(angle) * dist
      const y = cy + Math.sin(angle) * dist
      const chest = new Chest(this, x, y, 'rare', this.player)
      this.chests.add(chest)
    }
  }
}
