import Phaser from 'phaser'
import { CONFIG } from '../config/GameConfig'
import { Player, type HeroType } from '../entities/Player'
import { Orc2 } from '../entities/Orc2'
import { Orc1 } from '../entities/Orc1'
import { Orc3 } from '../entities/Orc3'
import type { BaseEnemy } from '../entities/BaseEnemy'
import { ClawsBoss } from '../entities/ClawsBoss'
import { WaveManager } from '../systems/WaveManager'
import { XPSystem, GoldSystem } from '../systems/XPSystem'
import { UpgradeTracker } from '../systems/UpgradeSystem'
import { Pickup } from '../entities/Pickup'
import { Chest } from '../entities/Chest'
import { ChunkManager } from '../systems/ChunkManager'
import { MetaProgress } from '../systems/MetaProgress'
import { KeyboardInputController } from '../systems/InputController'
import { isMobileDevice, isMobileUserAgent, isPortrait, gameFont } from '../utils/device'
import { NetworkGameAdapter } from '../systems/NetworkGameAdapter'
import { networkManager } from '../systems/NetworkManager'
import { Cat } from '../entities/Cat'

const ROCK_KEYS = [
  'rock1_1', 'rock1_2', 'rock2_1', 'rock2_2', 'rock3_1', 'rock3_2',
]

interface ClawSegment {
  y: number
  len: number
  w: number
  curve: number
}

export class GameScene extends Phaser.Scene {
  localPlayer!: Player
  players: Player[] = []
  /** @deprecated Use localPlayer. Kept for backward compat during migration. */
  get player(): Player { return this.localPlayer }
  enemies!: Phaser.Physics.Arcade.Group
  rocks!: Phaser.Physics.Arcade.StaticGroup
  waveManager!: WaveManager
  xpSystem!: XPSystem
  goldSystem!: GoldSystem
  upgradeTracker!: UpgradeTracker
  // Online level-up queue — prevents dropped UI when two players level up simultaneously
  private _pendingLevelUps: Array<{ player: Player; choices: any[]; isBranch: boolean }> = []
  private _levelUpActive = false
  pickups!: Phaser.GameObjects.Group
  chests!: Phaser.GameObjects.Group
  gameTime = 0
  private enemyHpBars!: Phaser.GameObjects.Graphics
  private gameOver = false
  bossDefeated = false
  private graves: Phaser.GameObjects.Image[] = []
  private _magnetFrame = 0
  private _hpBarsDirty = false
  private _hpBarFrame = 0
  protected selectedHero: HeroType = 'ignara'
  /** Read-only public alias for UIScene / minimap use. */
  get selectedHeroType(): HeroType { return this.selectedHero }
  protected terrainRT!: Phaser.GameObjects.RenderTexture
  private chunkManager?: ChunkManager
  private _hitStopActive = false
  _frameKills = 0
  /** Active intro reveal objects — tracked so shutdown() can clean them up if scene ends mid-animation */
  private _revealObjects: Phaser.GameObjects.GameObject[] = []
  private _localCoop = false
  private _p2Hero: HeroType = 'sifra'
  private _cameraTarget: Phaser.GameObjects.Rectangle | null = null
  private _nameplates: Phaser.GameObjects.Text[] = []
  _online = false
  _networkAdapter: NetworkGameAdapter | null = null
  private _playerSlots: Array<{ id: string; name: string; heroType: string; isHost: boolean }> = []
  private _seed = 0

  constructor(config?: Phaser.Types.Scenes.SettingsConfig) {
    super(config ?? { key: 'GameScene' })
  }

  init(data?: { hero?: HeroType; playerName?: string; localCoop?: boolean; online?: boolean; seed?: number; playerSlots?: Array<{ id: string; name: string; heroType: string; isHost: boolean }> }) {
    this.selectedHero = data?.hero || 'ignara'
    this._online = data?.online ?? false
    this._seed = data?.seed ?? 0
    this._playerSlots = data?.playerSlots ?? []
    this._localCoop = data?.localCoop ?? (!this._online && new URL(location.href).searchParams.has('coop'))
    if (this._localCoop) {
      const HERO_LIST: HeroType[] = ['ignara', 'sifra', 'amun', 'nazar', 'huntress', 'khashin', 'muller']
      this._p2Hero = (HERO_LIST.find(h => h !== this.selectedHero) || 'sifra') as HeroType
    }
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
    ss('vfx_thunder_splash', 'assets/vfx/thunder_splash.png', 48, 48)
    ss('vfx_thunder_strike', 'assets/vfx/thunder_strike.png', 64, 64)
    ss('vfx_air_burst', 'assets/vfx/air_burst.png', 48, 48)
    ss('vfx_air_explosion', 'assets/vfx/air_explosion.png', 32, 32)
    ss('vfx_fire_breath', 'assets/vfx/fire_breath.png', 64, 48)
    ss('vfx_fire_breath_hit', 'assets/vfx/fire_breath_hit.png', 48, 48)
    ss('vfx_firebolt', 'assets/vfx/firebolt.png', 48, 48)

    // Decorative cat companion
    ss('cat', 'assets/cat/cat.png', 32, 32)

    // Skill icons (128x128)
    ss('skill_icons', 'assets/icons/skill_icons_sheet.png', 128, 128)

    // Individual DALL-E skill icons
    img('icon_g1_sharp_edge', 'assets/icons/g1_sharp_edge.png')
    img('icon_g2_swift_feet', 'assets/icons/g2_swift_feet.png')
    img('icon_placeholder_a', 'assets/icons/placeholder_a.png')
    img('icon_placeholder_b', 'assets/icons/placeholder_b.png')

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
    img('shield_blue', 'assets/vfx/shield_blue.png')
    img('sword', 'assets/vfx/sword.png')
    img('deco_tree1', 'assets/terrain/tree1.png')
    img('deco_tree2', 'assets/terrain/tree2.png')
    img('deco_tree3', 'assets/terrain/tree3.png')
    img('zone_marker', 'assets/terrain/zone.png')

    // Props
    img('prop_grass_tuft1', 'assets/props/grass_tuft1.png')
    img('prop_grass_tuft3', 'assets/props/grass_tuft3.png')

    // Hero-specific assets
    this.loadHeroAssets(this.selectedHero, ss)

    // Local coop: also load assets for player 2's hero
    if (this._localCoop) {
      this.loadHeroAssets(this._p2Hero, ss)
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
        // Tutorial NPC: load Sifra idle so the quest 3 NPC uses her real sprite
        ss('sifra_idle',   'assets/sifra/Idle.png',     231, 190)
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

  create(data?: { hero?: HeroType }) {
    this.gameOver = false
    this.gameTime = 0
    if (data?.hero) this.selectedHero = data.hero
    // Initialise quest tracking for this run
    MetaProgress.initRun(this.selectedHero)

    // ── Pack 1: Immediate — what the player sees first frame ──
    this.generateVfxTextures()

    // VFX animations
    if (!this.anims.exists('flame_loop')) {
      this.anims.create({ key: 'flame_loop', frames: this.anims.generateFrameNumbers('vfx_flame', { start: 0, end: 3 }), frameRate: 12, repeat: -1 })
      this.anims.create({ key: 'flame_burst', frames: this.anims.generateFrameNumbers('vfx_flame', { start: 4, end: 4 }), frameRate: 8, repeat: 0 })
    }
    if (!this.anims.exists('thunder_splash')) {
      this.anims.create({ key: 'thunder_splash', frames: this.anims.generateFrameNumbers('vfx_thunder_splash', { start: 0, end: 13 }), frameRate: 24, repeat: 0 })
      this.anims.create({ key: 'thunder_strike', frames: this.anims.generateFrameNumbers('vfx_thunder_strike', { start: 0, end: 12 }), frameRate: 24, repeat: 0 })
      this.anims.create({ key: 'air_burst', frames: this.anims.generateFrameNumbers('vfx_air_burst', { start: 0, end: 8 }), frameRate: 20, repeat: 0 })
      this.anims.create({ key: 'air_explosion', frames: this.anims.generateFrameNumbers('vfx_air_explosion', { start: 0, end: 11 }), frameRate: 22, repeat: 0 })
      this.anims.create({ key: 'fire_breath', frames: this.anims.generateFrameNumbers('vfx_fire_breath', { start: 0, end: 17 }), frameRate: 16, repeat: -1 })
      this.anims.create({ key: 'fire_breath_once', frames: this.anims.generateFrameNumbers('vfx_fire_breath', { start: 0, end: 17 }), frameRate: 18, repeat: 0 })
      this.anims.create({ key: 'fire_breath_proj', frames: this.anims.generateFrameNumbers('vfx_fire_breath', { start: 0, end: 5 }), frameRate: 14, repeat: -1 })
      this.anims.create({ key: 'fire_breath_hit', frames: this.anims.generateFrameNumbers('vfx_fire_breath_hit', { start: 0, end: 4 }), frameRate: 16, repeat: 0 })
      this.anims.create({ key: 'firebolt_fly', frames: this.anims.generateFrameNumbers('vfx_firebolt', { start: 0, end: 3 }), frameRate: 12, repeat: -1 })
      this.anims.create({ key: 'firebolt_explode', frames: this.anims.generateFrameNumbers('vfx_firebolt', { start: 4, end: 10 }), frameRate: 18, repeat: 0 })
    }

    Orc1.createAnimations(this)
    Orc2.createAnimations(this)
    Orc3.createAnimations(this)
    Player.createAnimations(this)

    // Pre-warm all VFX sprite animations — prevents first-frame GPU upload stutter.
    // Each sprite plays one frame, is then destroyed. Cost: ~1ms at startup.
    const vfxWarmup: Array<[string, string]> = [
      ['vfx_air_burst',     'air_burst'],
      ['vfx_air_explosion', 'air_explosion'],
      ['vfx_firebolt',      'firebolt_fly'],
      ['vfx_firebolt',      'firebolt_explode'],
      ['vfx_thunder_splash','thunder_splash'],
      ['vfx_thunder_strike','thunder_strike'],
    ]
    for (const [tex, anim] of vfxWarmup) {
      if (!this.textures.exists(tex) || !this.anims.exists(anim)) continue
      const w = this.add.sprite(-9999, -9999, tex).setVisible(false).setActive(false)
      w.play(anim)
      this.time.delayedCall(0, () => w.destroy())
    }

    if (this.useInfiniteMap()) {
      // Infinite map path
      this.physics.world.setBounds(-1e7, -1e7, 2e7, 2e7)
      this.rocks = this.physics.add.staticGroup()
      this.localPlayer = new Player(this, 0, 0, this.selectedHero)
      this.players = [this.localPlayer]
      // NO camera.setBounds — infinite scroll
      this.chests = this.add.group()
      this.chunkManager = new ChunkManager(this, this.rocks, (x, y) => this.getZone(x, y), this.localPlayer, this.chests)
      this.chunkManager.create(0, 0)
      this.generateGraveTextures()
      this.events.emit('terrain-ready')
    } else {
      // Bounded map path (UndeadMapScene uses this)
      this.physics.world.setBounds(0, 0, CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT)
      this.rocks = this.physics.add.staticGroup()
      this.terrainRT = this.add.renderTexture(0, 0, CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT).setOrigin(0).setDepth(0)
      this.terrainRT.fill(0x305426)
      this.localPlayer = new Player(this, CONFIG.WORLD_WIDTH / 2, CONFIG.WORLD_HEIGHT / 2, this.selectedHero)
      this.players = [this.localPlayer]
      this.cameras.main.setBounds(0, 0, CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT)
      this.drawTerrainProgressive()
      this.scatterDecorations(0, Infinity)
      this.scatterRocks(0, Infinity)
      this.generateGraveTextures()
      this.events.emit('terrain-ready')
    }

    // ── Local coop: spawn player 2 with a different hero ──
    if (this._localCoop) {
      // Player 1 uses WASD only
      this.localPlayer.inputController?.destroy()
      this.localPlayer.inputController = new KeyboardInputController(this, 'wasd')

      // Player 2 spawns beside player 1 and uses arrow keys
      const p2 = new Player(this, this.localPlayer.x + 80, this.localPlayer.y, this._p2Hero)
      p2.isLocalPlayer = true  // both are local in local coop
      p2.inputController?.destroy()
      p2.inputController = new KeyboardInputController(this, 'arrows')
      this.players.push(p2)

      // Physics: player 2 collides with rocks
      this.physics.add.collider(p2, this.rocks)

      // Camera: follow invisible midpoint target with lerp
      this._cameraTarget = this.add.rectangle(this.localPlayer.x, this.localPlayer.y, 1, 1, 0, 0)
        .setVisible(false)
      this.cameras.main.startFollow(this._cameraTarget, true, 0.1, 0.1)

      // Nameplates for both players
      const np1 = this.add.text(0, 0, this.selectedHero.toUpperCase(), {
        fontFamily: gameFont(), fontSize: '11px', color: '#ffffff',
      }).setOrigin(0.5).setDepth(15)
      const np2 = this.add.text(0, 0, this._p2Hero.toUpperCase(), {
        fontFamily: gameFont(), fontSize: '11px', color: '#aaffaa',
      }).setOrigin(0.5).setDepth(15)
      this._nameplates = [np1, np2]
    } else {
      // Single player: follow localPlayer normally
      this.cameras.main.startFollow(this.localPlayer, true, 0.1, 0.1)
    }

    // Mobile-portrait camera zoom — zoom out 20% for wider field of view
    const applyPortraitZoom = () => {
      const mobilePortrait = isMobileUserAgent() && isPortrait()
      this.cameras.main.setZoom(mobilePortrait ? 0.8 : 1)
    }
    applyPortraitZoom()
    this.scale.on('resize', applyPortraitZoom)
    this.events.once('shutdown', () => this.scale.off('resize', applyPortraitZoom))

    // Zone marker centered on hero spawn
    this.add.image(this.player.x, this.player.y, 'zone_marker').setOrigin(0.5).setScale(0.252).setDepth(1).setAlpha(0.85)

    // Caesar — decorative cat companion
    Cat.registerAnims(this)
    this._caesar = new Cat(this, this.player.x + 60, this.player.y + 40, this.player)

    // ── Dark reveal effect: two shadow halves part to reveal the map ──
    this.playMapReveal()

    // Collide player with rocks and trees
    this.physics.add.collider(this.player, this.rocks)

    // Enemies group
    this.enemies = this.physics.add.group({ runChildUpdate: false })

    // Single batched graphics for all enemy HP bars
    this.enemyHpBars = this.add.graphics().setDepth(6)

    // Enemies collide with rocks — FlyingEye skips (it flies over obstacles)
    this.physics.add.collider(this.enemies, this.rocks, undefined, (enemy) => {
      return !(enemy as any).isFlying
    })

    // XP + Gold systems — use full players array (includes p2 in coop)
    this.xpSystem = new XPSystem(this, this.players)
    this.goldSystem = new GoldSystem(this, this.players)

    // Pickups group (HP orbs, magnets)
    this.pickups = this.add.group()

    // Chests — spawned by ChunkManager (infinite map) or manually (bounded map)
    if (!this.chests) this.chests = this.add.group()

    // Wave manager — use full players array (skipped in online mode — server controls spawning)
    this.waveManager = new WaveManager(this, this.players, this.enemies)

    // Touch controls — virtual joystick on mobile, tap-to-move on desktop
    this.setupTouchControls()

    // Events
    this.events.on('enemy-died', (x: number, y: number, xpValue: number, goldValue: number = 0, isMiniBoss: boolean = false, isLarge: boolean = false) => {
      // Mini-bosses always drop large purple orb; large mobs 25% chance
      if (isMiniBoss || (isLarge && Math.random() < 0.25)) {
        this.xpSystem.spawnLargeOrb(x, y, xpValue)
      } else {
        this.xpSystem.spawnOrb(x, y, xpValue)
      }
      this.player.kills++
      if (isMiniBoss) this.player.miniBossKills++
      MetaProgress.reportKill()
      // Branch Mastery: +0.25 XP on kill
      if (this.player.currentAttackBranch) {
        this.player.awardMasteryXP(this.player.currentAttackBranch, 0.25)
      }
      if (!this._online) this.waveManager.onEnemyKilled()
      this.spawnGrave(x, y)

      // Gold drop — bosses always, regular mobs 8% chance
      let gold = goldValue
      if (gold === 0 && Math.random() < CONFIG.GOLD_MOB_CHANCE) {
        gold = Phaser.Math.Between(CONFIG.GOLD_MOB_MIN, CONFIG.GOLD_MOB_MAX)
      }
      if (gold > 0) this.goldSystem.spawnOrb(x, y, gold)

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

      // (Stone Skin stacks now trigger on damage taken, not kills — see Player.takeDamage)

      // Ignara kill-triggered mechanics
      if (this.player.heroType === 'ignara' && this.player.hasPyromaniac
          && this.player.chosenBranch !== 'Wildfire') {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 2)
      }
      // Powder Keg counter
      if (this.player.hasPowderKeg) {
        this.player.powderKegCounter++
        if (this.player.powderKegCounter >= this.player.powderKegThreshold) {
          this.player.powderKegCounter = 0
          this.player.powderKegReady = true
        }
      }
      // Infernal Cadence: trigger on kill when off cooldown
      if (this.player.hasInfernalCadence && this.time.now > this.player.infernalCadenceEndTime) {
        this.player.infernalCadenceEndTime = this.time.now + this.player.infernalCadenceDuration
      }
      if (this.player.hasEmberVolley) {
        const maxStacks = Math.round(this.player.emberVolleyCap / 0.02)
        if (this.player.emberVolleyStacks < maxStacks) {
          this.player.emberVolleyStacks++
          this.player.attackCooldown = Math.max(200, Math.ceil(this.player.attackCooldown * 0.98))
          if (this.player.emberVolleyDmg) this.player.damage = Math.ceil(this.player.damage * 1.01)
        }
      }
      if (this.player.hasFlashpoint) {
        this.player.flashpointRemaining = Math.min(this.player.flashpointCharges, this.player.flashpointRemaining + 1)
      }

      // Heart drop with progressive thresholds: 100, 300, 500, then every 500
      const kills = this.player.kills
      const heartThresholds = [100, 300, 500]
      const isThreshold = heartThresholds.includes(kills) || (kills > 500 && kills % 500 === 0)
      if (isThreshold) {
        const heart = new Pickup(this, x, y, 'heart', this.player)
        this.pickups.add(heart)
      }

    })

    // Pickup overlap — collect on touch (all players)
    for (const p of this.players) {
      this.physics.add.overlap(p, this.pickups, (_player, pickup) => {
        (pickup as Pickup).collect()
      })
    }

    // Chest overlap — open on touch (all players)
    for (const p of this.players) {
      this.physics.add.overlap(p, this.chests, (_player, chest) => {
        (chest as Chest).open()
      })
    }

    // Magnet pickup — pull all XP orbs to nearest alive player
    this.events.on('magnet-activated', () => {
      const orbs = this.xpSystem.getOrbs().getChildren() as Phaser.Physics.Arcade.Sprite[]
      for (const orb of orbs) {
        if (!orb.active) continue
        // Find nearest alive player to pull toward
        let target = this.localPlayer
        let minDist = Infinity
        for (const p of this.players) {
          if (p.isDead) continue
          const d = Phaser.Math.Distance.Between(orb.x, orb.y, p.cx, p.cy)
          if (d < minDist) { minDist = d; target = p }
        }
        this.tweens.add({
          targets: orb,
          x: target.cx, y: target.cy,
          duration: 300,
          onComplete: () => {
            if (orb.active) {
              target.addXP((orb as any).xpValue || 10)
              orb.destroy()
            }
          },
        })
      }
    })

    this.upgradeTracker = new UpgradeTracker()

    this.events.on('player-levelup', (levelingPlayer?: Player) => {
      if (this._online) {
        const lvlPlayer = levelingPlayer ?? this.localPlayer
        const isBranch = this.upgradeTracker.isBranchSelection
        const choices = isBranch
          ? this.upgradeTracker.getBranchChoices(lvlPlayer.heroType, lvlPlayer.getActiveStance())
          : this.upgradeTracker.getChoices(lvlPlayer.heroType, lvlPlayer.getActiveStance())
        if (choices.length === 0) return
        // Queue level-ups — Phaser silently drops scene.launch if scene already active
        this._pendingLevelUps.push({ player: lvlPlayer, choices, isBranch })
        this._tryShowNextLevelUp()
        return
      }
      // Use the player that leveled up; fall back to localPlayer for backward compat
      const lvlPlayer = levelingPlayer ?? this.localPlayer
      // Kill nearby enemies so player can safely choose upgrades
      const CLEAR_RADIUS = 150
      const px = lvlPlayer.cx
      const py = lvlPlayer.cy
      for (const enemy of this.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (!enemy.active) continue
        const dist = Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y)
        if (dist < CLEAR_RADIUS && typeof (enemy as any).die === 'function') {
          (enemy as any).die()
        }
      }
      // Clear 50% of drops (XP orbs, gold, pickups) to reduce clutter.
      // Defer destroys to next frame so the spike doesn't overlap LevelUpScene launch.
      const toDestroy: Phaser.GameObjects.GameObject[] = []
      for (const orb of this.xpSystem.getOrbs().getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (orb.active && Math.random() < 0.5) toDestroy.push(orb)
      }
      for (const orb of this.goldSystem.getOrbs().getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        if (orb.active && Math.random() < 0.5) toDestroy.push(orb)
      }
      for (const p of this.pickups.getChildren() as Phaser.GameObjects.GameObject[]) {
        if (p.active && Math.random() < 0.5) toDestroy.push(p)
      }
      if (toDestroy.length) {
        this.time.delayedCall(0, () => { for (const o of toDestroy) if (o.active) o.destroy() })
      }
      const isBranch = this.upgradeTracker.isBranchSelection
      const choices = isBranch
        ? this.upgradeTracker.getBranchChoices(lvlPlayer.heroType, lvlPlayer.getActiveStance())
        : this.upgradeTracker.getChoices(lvlPlayer.heroType, lvlPlayer.getActiveStance())
      if (choices.length === 0) return  // all upgrades taken — skip level-up UI
      // Slow-motion cinematic pause before upgrade screen (300ms real-time at timeScale 0.15)
      this.physics.world.timeScale = 8
      this.time.timeScale = 0.15
      // delay of 45 scene-ms / 0.15 timeScale ≈ 300ms real time
      this.time.delayedCall(45, () => {
        this.physics.world.timeScale = 1
        this.time.timeScale = 1
        this.scene.launch('LevelUpScene', { player: lvlPlayer, tracker: this.upgradeTracker, callerSceneKey: this.scene.key })
        this.scene.pause()
      })
    })

    this.events.on('player-died', () => {
      // In local coop, only trigger game over when ALL players are dead
      const anyAlive = this.players.some(p => !p.isDead)
      if (!anyAlive) {
        this.gameOver = true
      }
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

    // Online multiplayer: create network adapter (handles remote players, enemies, server sync)
    if (this._online) {
      console.log(`[GameScene] Online mode: seed=${this._seed}, players=${this._playerSlots.length}`)
      this.localPlayer.serverAuthoritative = true
      this._networkAdapter = new NetworkGameAdapter(this, this.localPlayer)
      // Replace the local enemies group with network adapter's group
      // so ALL hero abilities (AoE, passives, splash) auto-target network enemies
      this.enemies = this._networkAdapter.enemySprites
      // Listen for network game events
      this.events.on('network-game-over', () => { this.gameOver = true })
      this.events.on('network-game-won', () => { this.gameOver = true })
      // Server echo only — client already applied optimistically in LevelUpScene
      this.events.on('network-upgrade-applied', (_upgradeId: string) => { /* no-op */ })
      // Small impact flash at remote attack hit position
      this.events.on('network-attack-vfx', (data: { playerId: string; x: number; y: number; damage: number }) => {
        const flash = this.add.circle(data.x, data.y, 10, 0xffffff, 0.7).setDepth(10)
        this.tweens.add({ targets: flash, alpha: 0, scaleX: 2.5, scaleY: 2.5, duration: 180, onComplete: () => flash.destroy() })
      })
      // When LevelUpScene closes in online mode, show next queued level-up
      this.events.on('levelup-closed', () => {
        this._levelUpActive = false
        this._tryShowNextLevelUp()
      })
      // Signal server that this client is loaded and ready
      networkManager.sendReady()
    }

    // Start spawning after brief delay (skipped in online mode — server controls spawning)
    if (!this._online) {
      this.time.delayedCall(2000, () => {
        this.waveManager.start()
      })
    }

    // ── Sifra NPC (Amun tutorial quest 3) ──
    // Spawn is gated: only after both q_forged_in_battle (kills) and
    // q_the_long_watch (200s) complete. Listen for quest-complete events.
    if (this.selectedHero === 'amun') {
      MetaProgress.onQuestComplete((qid) => {
        if (qid === 'q_forged_in_battle' || qid === 'q_the_long_watch') {
          this._trySpawnSifraNpc()
        }
      })
      // If both prereq quests were completed in a prior run but Sifra hasn't been
      // found yet, spawn the NPC immediately at run start (don't re-gate it).
      const killDone = MetaProgress.isQuestPersistentlyComplete('q_forged_in_battle')
      const timeDone = MetaProgress.isQuestPersistentlyComplete('q_the_long_watch')
      const sifraFound = MetaProgress.isQuestPersistentlyComplete('q_find_sifra')
      if (killDone && timeDone && !sifraFound) {
        this._spawnSifraNpc()
      }
    }
  }

  // ── Decorative cat companion ──────────────────────────────────────────────
  private _caesar: Cat | null = null

  // ── Sifra NPC state ───────────────────────────────────────────────────────
  private _sifraNpc: Phaser.GameObjects.GameObject | null = null
  private _sifraLabel: Phaser.GameObjects.Text | null = null
  private _sifraAuraGfx: Phaser.GameObjects.Graphics | null = null
  private _sifraAuraTween: Phaser.Tweens.Tween | null = null
  private _sifraAuraTimer: Phaser.Time.TimerEvent | null = null
  private _sifraProximityTimer: Phaser.Time.TimerEvent | null = null
  private _sifraFading = false
  /** World position of the Sifra NPC (set when spawned, read by UIScene for minimap). */
  sifraNpcX = 0
  sifraNpcY = 0

  /** Called from quest-complete listener — spawns NPC only when both first quests are done. */
  private _trySpawnSifraNpc(): void {
    if (this._sifraNpc || this.selectedHero !== 'amun') return
    const killGoal = 100
    const timeGoal = 150_000
    const killDone = MetaProgress.getQuestProgress('q_forged_in_battle') >= killGoal
    const timeDone = MetaProgress.getQuestProgress('q_the_long_watch') >= timeGoal
    if (killDone && timeDone) this._spawnSifraNpc()
  }

  private _spawnSifraNpc(): void {
    // 50% of previous range (was 700-1000), centered around hero spawn point (0,0)
    const angle = Math.random() * Math.PI * 2
    const dist = 350 + Math.random() * 150
    const nx = Math.cos(angle) * dist
    const ny = Math.sin(angle) * dist
    this.sifraNpcX = nx
    this.sifraNpcY = ny

    // Real Sifra hero sprite (idle animation)
    if (this.textures.exists('sifra_idle')) {
      const sprite = this.add.sprite(nx, ny, 'sifra_idle', 0).setDepth(4)
      if (!this.anims.exists('sifra_npc_idle')) {
        this.anims.create({
          key: 'sifra_npc_idle',
          frames: this.anims.generateFrameNumbers('sifra_idle', { start: 0, end: 3 }),
          frameRate: 6, repeat: -1,
        })
      }
      sprite.play('sifra_npc_idle')
      this._sifraNpc = sprite
    } else {
      // Fallback placeholder if asset missing
      const g = this.add.graphics().setDepth(4)
      g.fillStyle(0x82ccdd, 0.9)
      g.fillCircle(nx, ny, 16)
      g.lineStyle(2, 0xffffff, 0.8)
      g.strokeCircle(nx, ny, 16)
      this._sifraNpc = g
    }

    // "?" label above NPC
    this._sifraLabel = this.add.text(nx, ny - 60, '?', {
      fontFamily: gameFont(), fontSize: '20px', color: '#FFD700',
    }).setOrigin(0.5).setDepth(5)

    // ── Aura: 200% × Sifra base range (160) = 320px ──
    // Pulsing icy ring + kills basic mobs (skips mini-bosses & boss) every 200ms.
    const auraRadius = 320
    this._sifraAuraGfx = this.add.graphics().setDepth(3)
    const drawAura = (pulseT: number) => {
      const g = this._sifraAuraGfx
      if (!g) return
      g.clear()
      // Soft layered fill from center outward
      for (let i = 4; i >= 1; i--) {
        const a = 0.04 + pulseT * 0.04
        g.fillStyle(0x82ccdd, a)
        g.fillCircle(nx, ny, auraRadius * (0.55 + i * 0.11))
      }
      // Crisp ring at outer edge
      g.lineStyle(2, 0xaaeeff, 0.45 + pulseT * 0.35)
      g.strokeCircle(nx, ny, auraRadius)
      // Inner ring for depth
      g.lineStyle(1, 0xffffff, 0.25 + pulseT * 0.2)
      g.strokeCircle(nx, ny, auraRadius * 0.85)
    }
    drawAura(0)
    this._sifraAuraTween = this.tweens.add({
      targets: { t: 0 },
      t: 1,
      duration: 1400, yoyo: true, repeat: -1,
      onUpdate: (tw) => drawAura(tw.getValue() as number),
    })

    // Aura kill timer: every 200ms, instakill basic enemies inside the radius
    const r2 = auraRadius * auraRadius
    this._sifraAuraTimer = this.time.addEvent({
      delay: 200, loop: true,
      callback: () => {
        if (!this._sifraNpc) return
        for (const e of this.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
          if (!e.active) continue
          if ((e as any).isMiniBoss) continue
          const dx = e.x - nx, dy = e.y - ny
          if (dx * dx + dy * dy <= r2) {
            ;(e as any).takeDamage?.(99999, 'magic')
          }
        }
      },
    })

    // Proximity check (every 200ms, not every frame)
    this._sifraProximityTimer = this.time.addEvent({
      delay: 200, loop: true,
      callback: () => {
        if (!this._sifraNpc || !this._sifraNpc.active || this._sifraFading) return
        const dx = this.player.x - this.sifraNpcX
        const dy = this.player.y - this.sifraNpcY
        if (Math.sqrt(dx * dx + dy * dy) < 80) {
          MetaProgress.reportSifraFound()
          this._sifraProximityTimer?.remove()
          this._sifraProximityTimer = null
          this._fadeOutSifra()
        }
      },
    })
  }

  /** Smoothly fade out Sifra NPC + aura after the player meets her. */
  public _fadeOutSifra(): void {
    if (this._sifraFading) return
    this._sifraFading = true

    // Stop aura tick + aura pulse tween
    this._sifraAuraTimer?.remove(); this._sifraAuraTimer = null
    this._sifraAuraTween?.stop(); this._sifraAuraTween = null

    const duration = 1200
    // Fade NPC sprite/graphic
    if (this._sifraNpc) {
      this.tweens.add({
        targets: this._sifraNpc, alpha: 0,
        duration, ease: 'Quad.easeOut',
        onComplete: () => { this._sifraNpc?.destroy(); this._sifraNpc = null },
      })
    }
    // Fade "?" label
    if (this._sifraLabel) {
      this.tweens.add({
        targets: this._sifraLabel, alpha: 0, y: this._sifraLabel.y - 30,
        duration, ease: 'Quad.easeOut',
        onComplete: () => { this._sifraLabel?.destroy(); this._sifraLabel = null },
      })
    }
    // Fade aura graphics (object alpha, since we already stopped the redraw tween)
    if (this._sifraAuraGfx) {
      this.tweens.add({
        targets: this._sifraAuraGfx, alpha: 0,
        duration, ease: 'Quad.easeOut',
        onComplete: () => { this._sifraAuraGfx?.destroy(); this._sifraAuraGfx = null },
      })
    }
  }

  protected useInfiniteMap(): boolean { return true }

  /** Returns the biome zone (0-4) for a world pixel position. */
  public getZone(px: number, py: number): number {
    const dist = Phaser.Math.Distance.Between(px, py, 0, 0)
    if (dist < 600) return 0
    if (dist < 1200) return 1
    if (dist < 1800) return 2
    if (dist < 2400) return 3
    return 4
  }

  /** Dark shadow halves part to reveal the map — runs once on scene start */
  private playMapReveal() {
    const cam = this.cameras.main
    const sw = cam.width
    const sh = cam.height
    const cx = sw / 2

    // ── Draw two demon-claw shadow halves with jagged claw edges ──
    const leftGfx = this.add.graphics().setDepth(999).setScrollFactor(0)
    const rightGfx = this.add.graphics().setDepth(999).setScrollFactor(0)
    this._revealObjects.push(leftGfx, rightGfx)

    // Claw parameters — 5 claws per side reaching inward
    const clawCount = 5
    const clawData: ClawSegment[] = []
    for (let i = 0; i < clawCount; i++) {
      const t = (i + 0.5) / clawCount
      clawData.push({
        y: t * sh,
        len: 50 + Math.random() * 40,   // how far the claw reaches past center
        w: 25 + Math.random() * 20,      // width of claw base
        curve: 10 + Math.random() * 15,  // curve offset for organic feel
      })
    }

    const drawSide = (g: Phaser.GameObjects.Graphics, side: 'left' | 'right') => {
      g.clear()
      // Solid dark fill for the half
      g.fillStyle(0x0a0008, 1)
      if (side === 'left') {
        g.fillRect(-sw, 0, sw + cx, sh)
      } else {
        g.fillRect(cx, 0, sw, sh)
      }

      // Draw claw fingers reaching toward center
      for (const c of clawData) {
        const dir = side === 'left' ? 1 : -1
        const baseX = side === 'left' ? cx : cx
        const tipX = baseX + dir * c.len

        g.fillStyle(0x1a0015, 1)
        g.beginPath()
        // Claw shape: wide base tapering to sharp point
        g.moveTo(baseX, c.y - c.w / 2)
        g.lineTo(baseX + dir * c.len * 0.4, c.y - c.w * 0.35 + c.curve * 0.3)
        g.lineTo(tipX, c.y + dir * 3)  // sharp tip, slightly curved
        g.lineTo(baseX + dir * c.len * 0.4, c.y + c.w * 0.35 - c.curve * 0.2)
        g.lineTo(baseX, c.y + c.w / 2)
        g.closePath()
        g.fillPath()

        // Inner claw highlight (dark purple/red vein)
        g.lineStyle(2, 0x330022, 0.6)
        g.beginPath()
        g.moveTo(baseX, c.y)
        g.lineTo(baseX + dir * c.len * 0.5, c.y + c.curve * 0.15)
        g.lineTo(tipX, c.y + dir * 3)
        g.strokePath()

        // Claw tip nail — lighter pointed triangle
        const nailLen = 12
        g.fillStyle(0x443344, 0.9)
        g.beginPath()
        g.moveTo(tipX, c.y + dir * 3)
        g.lineTo(tipX + dir * nailLen, c.y + dir * 1)
        g.lineTo(tipX + dir * 2, c.y + dir * 3 + 5)
        g.lineTo(tipX + dir * 2, c.y + dir * 3 - 5)
        g.closePath()
        g.fillPath()
      }

      // Jagged edge along the seam (torn skin / shadow border)
      g.fillStyle(0x0a0008, 1)
      const edgeX = side === 'left' ? cx : cx
      const jagSegments = 20
      g.beginPath()
      g.moveTo(edgeX, 0)
      for (let i = 0; i <= jagSegments; i++) {
        const py = (i / jagSegments) * sh
        const jag = (Math.sin(i * 2.7) * 8 + Math.sin(i * 5.1) * 4) * (side === 'left' ? 1 : -1)
        g.lineTo(edgeX + jag, py)
      }
      g.lineTo(edgeX, sh)
      // Fill back to solid side
      const solidX = side === 'left' ? -sw : sw * 2
      g.lineTo(solidX, sh)
      g.lineTo(solidX, 0)
      g.closePath()
      g.fillPath()
    }

    drawSide(leftGfx, 'left')
    drawSide(rightGfx, 'right')

    // ── Fog wisps along the seam ──
    const fogParts: Phaser.GameObjects.Graphics[] = []
    for (let i = 0; i < 18; i++) {
      const fy = Math.random() * sh
      const fg = this.add.graphics().setDepth(1000).setScrollFactor(0)
      const size = 10 + Math.random() * 25
      const alpha = 0.15 + Math.random() * 0.25
      // Soft fog blob
      fg.fillStyle(0x221133, alpha)
      fg.fillCircle(cx + (Math.random() - 0.5) * 30, fy, size)
      fg.fillStyle(0x110022, alpha * 0.6)
      fg.fillCircle(cx + (Math.random() - 0.5) * 20, fy + (Math.random() - 0.5) * 10, size * 0.7)
      fogParts.push(fg)
      this._revealObjects.push(fg)
    }

    // ── Red glow eyes peering from the darkness (2 pairs) ──
    const eyes: Phaser.GameObjects.Arc[] = []
    const eyePositions = [
      { x: cx - 80, y: sh * 0.25 }, { x: cx - 68, y: sh * 0.25 + 2 },
      { x: cx + 68, y: sh * 0.65 }, { x: cx + 80, y: sh * 0.65 - 1 },
    ]
    for (const ep of eyePositions) {
      const eye = this.add.circle(ep.x, ep.y, 3, 0xff2200, 0.8).setDepth(1001).setScrollFactor(0)
      eyes.push(eye)
      // Inner bright pupil
      const pupil = this.add.circle(ep.x, ep.y, 1.5, 0xff6644, 1).setDepth(1002).setScrollFactor(0)
      eyes.push(pupil)
    }
    this._revealObjects.push(...eyes)

    // ── Animate: hold briefly, then part ──
    const holdTime = 300
    const partDuration = 800

    // Eyes fade first
    this.time.delayedCall(holdTime - 100, () => {
      for (const e of eyes) {
        this.tweens.add({
          targets: e, alpha: 0, duration: 200,
          onComplete: () => e.destroy(),
        })
      }
    })

    // Claws part — redraw each frame as x shifts
    const leftTarget = { x: 0 }
    const rightTarget = { x: 0 }

    this.tweens.add({
      targets: leftTarget, x: -(sw / 2 + 100), duration: partDuration,
      ease: 'Cubic.easeIn', delay: holdTime,
      onUpdate: () => {
        leftGfx.setX(leftTarget.x)
      },
      onComplete: () => leftGfx.destroy(),
    })

    this.tweens.add({
      targets: rightTarget, x: sw / 2 + 100, duration: partDuration,
      ease: 'Cubic.easeIn', delay: holdTime,
      onUpdate: () => {
        rightGfx.setX(rightTarget.x)
      },
      onComplete: () => rightGfx.destroy(),
    })

    // Fog dissipates
    for (const fg of fogParts) {
      const goLeft = Math.random() < 0.5
      this.tweens.add({
        targets: fg,
        x: goLeft ? -60 : 60,
        alpha: 0, duration: 600 + Math.random() * 400,
        delay: holdTime + 100 + Math.random() * 300,
        onComplete: () => fg.destroy(),
      })
    }

    // Final: subtle dark vignette fade
    const vignette = this.add.graphics().setDepth(998).setScrollFactor(0)
    vignette.fillStyle(0x000000, 0.3)
    vignette.fillRect(0, 0, sw, sh)
    this._revealObjects.push(vignette)
    this.tweens.add({
      targets: vignette, alpha: 0, duration: 500,
      delay: holdTime + partDuration * 0.5,
      onComplete: () => vignette.destroy(),
    })
  }

  /** Draw all terrain tiles synchronously onto the RenderTexture */
  protected drawTerrainProgressive() {
    const tileSize = CONFIG.TILE_SIZE
    const totalRows = Math.ceil(CONFIG.WORLD_HEIGHT / tileSize)
    const cols = Math.ceil(CONFIG.WORLD_WIDTH / tileSize)
    const GRASS_FRAMES = [4, 5, 6, 7, 12, 13, 14, 15, 20, 21, 22, 23, 28, 29, 30, 31]

    const rng = (x: number, y: number, salt: number) => {
      const n = Math.sin(x * 127.1 + y * 311.7 + salt * 42) * 43758.5453
      return n - Math.floor(n)
    }

    const tmpTile = this.add.image(0, 0, 'terrain_grass', 0).setScale(2).setVisible(false)

    for (let r = 0; r < totalRows; r++) {
      for (let c = 0; c < cols; c++) {
        const px = c * tileSize + tileSize / 2
        const py = r * tileSize + tileSize / 2
        const zone = this.getZone(px, py)
        const rand = rng(c, r, 3)
        const grassFrame = GRASS_FRAMES[Math.floor(rand * GRASS_FRAMES.length)]
        tmpTile.setFrame(grassFrame).setPosition(px, py)

        if (zone === 3) tmpTile.setTint(0x8f9f8f)
        else if (zone === 4) tmpTile.setTint(0x7e8f7e)
        else tmpTile.setTint(0xb1c1b1)

        this.terrainRT.draw(tmpTile)
      }
    }

    tmpTile.destroy()
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
        rock.setDepth(2).setScale(Phaser.Math.FloatBetween(0.9, 1.8))
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
    const isMobile = isMobileDevice()

    if (!isMobile) {
      // Desktop: tap-to-move
      this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        this.localPlayer.setTouchTarget(pointer.worldX, pointer.worldY)
      })
      this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        if (pointer.isDown) {
          this.localPlayer.setTouchTarget(pointer.worldX, pointer.worldY)
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
      this.localPlayer.clearJoystick()
    }

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Only use left half of screen for joystick
      if (pointer.x < this.scale.width * 0.5 && pointer.y > 150 && activePointerId === -1) {
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
        this.localPlayer.clearJoystick()
        return
      }

      // Clamp knob to radius
      const clampDist = Math.min(dist, JOYSTICK_RADIUS)
      const nx = dx / dist
      const ny = dy / dist
      const knobX = joyOrigin.x + nx * clampDist
      const knobY = joyOrigin.y + ny * clampDist

      drawKnob(knobX, knobY)
      this.localPlayer.setJoystickDirection(nx, ny)
    })

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === activePointerId) {
        hideJoystick()
      }
    })
  }

  private generateVfxTextures() {
    // Short-circuit: if the first texture exists, all were generated in a prior run
    if (this.textures.exists('vfx_fireball')) return

    // Flame blob — soft radial gradient circle (16x16)
    const fb = this.add.graphics({ x: 0, y: 0 }).setVisible(false)
    fb.fillStyle(0xffffff, 1)
    fb.fillCircle(8, 8, 8)
    fb.fillStyle(0xffffff, 0.6)
    fb.fillCircle(8, 8, 5)
    fb.generateTexture('vfx_fireball', 16, 16)
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

    this.graves.push(grave)
    if (this.graves.length > 50) {
      const oldest = this.graves.shift()
      oldest?.destroy()
    }
  }

  private spawnClawsBoss() {
    // Kill all remaining mobs
    for (const enemy of this.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (enemy.active) enemy.destroy()
    }

    const bx = this.player.x - 400
    const by = this.player.y

    const boss = new ClawsBoss(this, bx, by, this.player)
    this.enemies.add(boss)

    // Listen for minion spawns (Phase 2 transition)
    this.events.once('boss-spawn-minions', (count: number) => {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count
        const r = 220
        const mx = Phaser.Math.Clamp(boss.x + Math.cos(angle) * r, 100, 2900)
        const my = Phaser.Math.Clamp(boss.y + Math.sin(angle) * r, 100, 2900)
        if (this.waveManager) {
          this.waveManager.spawnMobAt('orc1', mx, my)
        }
      }
    })

    // Victory — set gameOver after delay so death VFX can play
    this.events.once('boss-defeated', () => {
      this.bossDefeated = true
      this.time.delayedCall(3000, () => { this.gameOver = true })
    })
  }

  update(time: number, delta: number) {
    if (this.gameOver) return

    // Clamp delta to 100ms to prevent massive accumulated damage from lag spikes
    // or tab-switch resumption. A spike of 1000ms × 30 enemies = insta-death.
    const dt = Math.min(delta, 100)

    this._frameKills = 0

    this._caesar?.update(dt)

    this.chunkManager?.update(this.localPlayer.x, this.localPlayer.y)

    // Online mode: network adapter handles remote players, enemies, input sending
    if (this._networkAdapter) {
      this._networkAdapter.update(time, dt)
    }

    this.gameTime += dt

    for (const p of this.players) {
      p.update(time, dt)
      p.tryAutoAttack(this.enemies, time, dt)
    }

    // Local coop: move camera target to midpoint between alive players
    if (this._cameraTarget && this.players.length > 1) {
      const alive = this.players.filter(p => !p.isDead)
      if (alive.length > 0) {
        this._cameraTarget.x = alive.reduce((s, p) => s + p.x, 0) / alive.length
        this._cameraTarget.y = alive.reduce((s, p) => s + p.y, 0) / alive.length
      }
    }

    // Update nameplates (local coop)
    if (this._nameplates.length > 0) {
      for (let i = 0; i < this._nameplates.length && i < this.players.length; i++) {
        const np = this._nameplates[i]
        const p = this.players[i]
        np.setPosition(p.x, p.y - 40)
        np.setVisible(!p.isDead)
      }
    }

    // XP/gold magnet pull — throttled to every 6 frames (velocity persists between recalcs)
    this._magnetFrame = (this._magnetFrame + 1) % 6
    if (this._magnetFrame === 0) {
      this.xpSystem.updateMagnet()
      this.goldSystem.updateMagnet()
    }

    // Single merged enemy loop: update + HP bars
    // HP bars are redrawn only when an enemy took damage (hpDirty) OR every 3 frames
    // to keep bar positions in sync with moving enemies. This avoids 200+ draw calls
    // per frame when no damage occurs.
    this._hpBarFrame = (this._hpBarFrame + 1) % 3
    this._hpBarsDirty = this._hpBarFrame === 0

    const enemies = this.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]
    for (const enemy of enemies) {
      if (!enemy.active) continue
      // Online enemies are plain sprites (no BaseEnemy.update) — adapter handles them
      if (!this._online) {
        ;(enemy as unknown as BaseEnemy).update(time, dt)

        const e = enemy as any
        if (e.hpDirty) {
          this._hpBarsDirty = true
        }
      }
    }

    if (this._hpBarsDirty) {
      this.enemyHpBars.clear()
      for (const enemy of enemies) {
        if (!enemy.active) continue
        const e = enemy as any
        if (e.isBoss) continue  // Boss HP bar is rendered by UIScene
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
        if (e.hpDirty !== undefined) e.hpDirty = false
      }
      // Online mode: draw HP bars for network enemies
      if (this._networkAdapter) {
        this._networkAdapter.drawEnemyHpBars(this.enemyHpBars)
      }
    }
  }


  private _tryShowNextLevelUp() {
    if (this._levelUpActive || this._pendingLevelUps.length === 0) return
    const next = this._pendingLevelUps.shift()!
    this._levelUpActive = true
    this.scene.launch('LevelUpScene', {
      player: next.player,
      tracker: this.upgradeTracker,
      callerSceneKey: this.scene.key,
      onlineMode: true,
      isBranchSelection: next.isBranch,
      choices: next.choices,
    })
  }

  applyHitStop(duration = 15) {
    if (this._hitStopActive) return
    this._hitStopActive = true
    this.physics.world.timeScale = 20   // effectively pause physics
    this.time.timeScale = 0.05          // slow scene time
    this.time.delayedCall(duration, () => {
      this.physics.world.timeScale = 1
      this.time.timeScale = 1
      this._hitStopActive = false
    })
  }

  shutdown() {
    this.events.off('enemy-died')
    this.events.off('magnet-activated')
    this.events.off('player-levelup')
    this.events.off('player-died')
    this.events.off('claws-incoming')
    this.events.off('claws-spawn')
    // Cancel Sifra tutorial tweens/timers (NPC, aura, proximity)
    this._sifraAuraTween?.stop(); this._sifraAuraTween = null
    this._sifraAuraTimer?.remove(); this._sifraAuraTimer = null
    this._sifraProximityTimer?.remove(); this._sifraProximityTimer = null
    this._sifraAuraGfx?.destroy(); this._sifraAuraGfx = null
    this._sifraLabel?.destroy(); this._sifraLabel = null
    this._sifraNpc = null
    this._sifraFading = false
    // Destroy any still-live intro reveal graphics (fog/claws/eyes/vignette)
    // if the scene shuts down before their fade tweens complete.
    for (const obj of this._revealObjects) {
      if (obj && obj.active) {
        this.tweens.killTweensOf(obj)
        obj.destroy()
      }
    }
    this._revealObjects.length = 0
    this._networkAdapter?.destroy()
    this._networkAdapter = null
    this.chunkManager?.destroy()
    this.chunkManager = undefined
    for (const p of this.players) {
      p?.destroy()
    }
    this.players = []
    for (const np of this._nameplates) np?.destroy()
    this._nameplates = []
    this._cameraTarget?.destroy()
    this._cameraTarget = null
  }

}
