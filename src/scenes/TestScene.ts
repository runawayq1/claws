import Phaser from 'phaser'
import { Player, type HeroType } from '../entities/Player'
import { Orc2 } from '../entities/Skeleton'
import { Orc1 } from '../entities/Zergling'
import { FlyingEye } from '../entities/Scorpion'
import { SandGolem } from '../entities/SandGolem'

export class TestScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TestScene' })
  }

  preload() {
    // Monster enemy spritesheets (150x150 side-view — mushroom/flyingeye used by SandGolem/FlyingEye)
    this.load.spritesheet('mushroom_attack', 'assets/mushroom/Attack3.png', { frameWidth: 150, frameHeight: 150 })
    this.load.spritesheet('flyingeye_attack', 'assets/flying_eye/Attack3.png', { frameWidth: 150, frameHeight: 150 })

    // Orc enemies (64x64 top-down, 4 directional rows — we use row 0)
    this.load.spritesheet('orc1_idle',   'assets/orc/orc1_idle_without_shadow.png',   { frameWidth: 64, frameHeight: 64 })
    this.load.spritesheet('orc1_run',    'assets/orc/orc1_run_without_shadow.png',    { frameWidth: 64, frameHeight: 64 })
    this.load.spritesheet('orc1_attack', 'assets/orc/orc1_attack_without_shadow.png', { frameWidth: 64, frameHeight: 64 })
    this.load.spritesheet('orc1_hurt',   'assets/orc/orc1_hurt_without_shadow.png',   { frameWidth: 64, frameHeight: 64 })
    this.load.spritesheet('orc1_death',  'assets/orc/orc1_death_without_shadow.png',  { frameWidth: 64, frameHeight: 64 })

    this.load.spritesheet('orc2_idle',   'assets/orc2/orc2_idle_without_shadow.png',   { frameWidth: 64, frameHeight: 64 })
    this.load.spritesheet('orc2_run',    'assets/orc2/orc2_run_without_shadow.png',    { frameWidth: 64, frameHeight: 64 })
    this.load.spritesheet('orc2_attack', 'assets/orc2/orc2_attack_without_shadow.png', { frameWidth: 64, frameHeight: 64 })
    this.load.spritesheet('orc2_hurt',   'assets/orc2/orc2_hurt_without_shadow.png',   { frameWidth: 64, frameHeight: 64 })
    this.load.spritesheet('orc2_death',  'assets/orc2/orc2_death_without_shadow.png',  { frameWidth: 64, frameHeight: 64 })

    // Ignara hero — Evil Wizard 1 (150x150 frames)
    this.load.spritesheet('ignara_idle', 'assets/ignara/Idle.png', { frameWidth: 150, frameHeight: 150 })
    this.load.spritesheet('ignara_run', 'assets/ignara/Move.png', { frameWidth: 150, frameHeight: 150 })
    this.load.spritesheet('ignara_attack', 'assets/ignara/Attack.png', { frameWidth: 150, frameHeight: 150 })
    this.load.spritesheet('ignara_hurt', 'assets/ignara/Take Hit.png', { frameWidth: 150, frameHeight: 150 })
    this.load.spritesheet('ignara_death', 'assets/ignara/Death.png', { frameWidth: 150, frameHeight: 150 })

    // Sifra hero — Wizard Pack (231x190 frames)
    this.load.spritesheet('sifra_idle', 'assets/sifra/Idle.png', { frameWidth: 231, frameHeight: 190 })
    this.load.spritesheet('sifra_run', 'assets/sifra/Run.png', { frameWidth: 231, frameHeight: 190 })
    this.load.spritesheet('sifra_attack', 'assets/sifra/Attack1.png', { frameWidth: 231, frameHeight: 190 })
    this.load.spritesheet('sifra_hurt', 'assets/sifra/Hit.png', { frameWidth: 231, frameHeight: 190 })
    this.load.spritesheet('sifra_death', 'assets/sifra/Death.png', { frameWidth: 231, frameHeight: 190 })

    // Nazar hero — Martial Hero (200x200 frames)
    this.load.spritesheet('nazar_idle', 'assets/nazar/Idle.png', { frameWidth: 200, frameHeight: 200 })
    this.load.spritesheet('nazar_run', 'assets/nazar/Run.png', { frameWidth: 200, frameHeight: 200 })
    this.load.spritesheet('nazar_attack', 'assets/nazar/Attack1.png', { frameWidth: 200, frameHeight: 200 })
    this.load.spritesheet('nazar_hurt', 'assets/nazar/Take Hit.png', { frameWidth: 200, frameHeight: 200 })
    this.load.spritesheet('nazar_death', 'assets/nazar/Death.png', { frameWidth: 200, frameHeight: 200 })

    // Amun hero — Medieval King (160x111 frames)
    this.load.spritesheet('amun_idle', 'assets/amun/Idle.png', { frameWidth: 160, frameHeight: 111 })
    this.load.spritesheet('amun_run', 'assets/amun/Run.png', { frameWidth: 160, frameHeight: 111 })
    this.load.spritesheet('amun_attack', 'assets/amun/Attack1.png', { frameWidth: 160, frameHeight: 111 })
    this.load.spritesheet('amun_hurt', 'assets/amun/Take Hit.png', { frameWidth: 160, frameHeight: 111 })
    this.load.spritesheet('amun_death', 'assets/amun/Death.png', { frameWidth: 160, frameHeight: 111 })

    // Huntress hero (150x150 frames)
    this.load.spritesheet('huntress_idle', 'assets/lyra/Idle.png', { frameWidth: 150, frameHeight: 150 })
    this.load.spritesheet('huntress_run', 'assets/lyra/Run.png', { frameWidth: 150, frameHeight: 150 })
    this.load.spritesheet('huntress_attack', 'assets/lyra/Attack1.png', { frameWidth: 150, frameHeight: 150 })
    this.load.spritesheet('huntress_attack2', 'assets/lyra/Attack2.png', { frameWidth: 150, frameHeight: 150 })
    this.load.spritesheet('huntress_ranged', 'assets/lyra/Attack3.png', { frameWidth: 150, frameHeight: 150 })
    this.load.spritesheet('huntress_hurt', 'assets/lyra/Take hit.png', { frameWidth: 150, frameHeight: 150 })
    this.load.spritesheet('huntress_death', 'assets/lyra/Death.png', { frameWidth: 150, frameHeight: 150 })

    // Khashin hero (288x128 frames)
    this.load.spritesheet('khashin_idle', 'assets/khashin/Idle.png', { frameWidth: 288, frameHeight: 128 })
    this.load.spritesheet('khashin_run', 'assets/khashin/Run.png', { frameWidth: 288, frameHeight: 128 })
    this.load.spritesheet('khashin_attack', 'assets/khashin/Attack.png', { frameWidth: 288, frameHeight: 128 })
    this.load.spritesheet('khashin_air_attack', 'assets/khashin/Air_attack.png', { frameWidth: 288, frameHeight: 128 })
    this.load.spritesheet('khashin_special', 'assets/khashin/Special.png', { frameWidth: 288, frameHeight: 128 })
    this.load.spritesheet('khashin_hurt', 'assets/khashin/Take_hit.png', { frameWidth: 288, frameHeight: 128 })
    this.load.spritesheet('khashin_death', 'assets/khashin/Death.png', { frameWidth: 288, frameHeight: 128 })

    // Crystal Muller hero (288x128 frames)
    this.load.spritesheet('muller_idle', 'assets/givi/Idle.png', { frameWidth: 288, frameHeight: 128 })
    this.load.spritesheet('muller_run', 'assets/givi/Run.png', { frameWidth: 288, frameHeight: 128 })
    this.load.spritesheet('muller_attack', 'assets/givi/Attack.png', { frameWidth: 288, frameHeight: 128 })
    this.load.spritesheet('muller_ground_slam', 'assets/givi/Ground_slam.png', { frameWidth: 288, frameHeight: 128 })
    this.load.spritesheet('muller_special', 'assets/givi/Special.png', { frameWidth: 288, frameHeight: 128 })
    this.load.spritesheet('muller_hurt', 'assets/givi/Take_hit.png', { frameWidth: 288, frameHeight: 128 })
    this.load.spritesheet('muller_death', 'assets/givi/Death.png', { frameWidth: 288, frameHeight: 128 })

    // Givi individual crystal VFX sprites
    this.load.spritesheet('crystal_green_0', 'assets/givi/crystal_green_0.png', { frameWidth: 75, frameHeight: 78 })
    this.load.spritesheet('crystal_green_1', 'assets/givi/crystal_green_1.png', { frameWidth: 65, frameHeight: 41 })
    this.load.spritesheet('crystal_pink_0', 'assets/givi/crystal_pink_0.png', { frameWidth: 63, frameHeight: 61 })
    this.load.spritesheet('crystal_pink_1', 'assets/givi/crystal_pink_1.png', { frameWidth: 30, frameHeight: 21 })
    this.load.spritesheet('crystal_blue_0', 'assets/givi/crystal_blue_0.png', { frameWidth: 54, frameHeight: 51 })
    this.load.spritesheet('crystal_blue_1', 'assets/givi/crystal_blue_1.png', { frameWidth: 43, frameHeight: 27 })

    // Boss demon slime (288x160 frames)
    this.load.spritesheet('boss_demon', 'assets/boss_demon/spritesheet.png', { frameWidth: 288, frameHeight: 160 })

    // Rock images
    this.load.image('rock1_1', 'assets/rocks/Rock1_1_no_shadow.png')
    this.load.image('rock1_2', 'assets/rocks/Rock1_2_no_shadow.png')
    this.load.image('rock2_1', 'assets/rocks/Rock2_1_no_shadow.png')
    this.load.image('rock2_2', 'assets/rocks/Rock2_2_no_shadow.png')
    this.load.image('rock3_1', 'assets/rocks/Rock3_1_no_shadow.png')
    this.load.image('rock3_2', 'assets/rocks/Rock3_2_no_shadow.png')

    // Tree images (decorative)
    this.load.image('deco_tree1', 'assets/terrain/tree1.png')
    this.load.image('deco_tree2', 'assets/terrain/tree2.png')
    this.load.image('deco_tree3', 'assets/terrain/tree3.png')
  }

  create() {
    const { width } = this.scale

    // Dark background
    this.cameras.main.setBackgroundColor(0x0a0a0a)

    // Title
    this.add.text(width / 2, 30, 'HITBOX TEST', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0).setDepth(20)

    // Back button
    const backBtn = this.add.text(16, 16, '< BACK', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#888888',
      stroke: '#000000',
      strokeThickness: 3,
      backgroundColor: '#1a1a2e',
      padding: { x: 10, y: 6 },
    }).setOrigin(0, 0).setDepth(20).setInteractive({ useHandCursor: true })
    backBtn.on('pointerover', () => backBtn.setColor('#FFD700'))
    backBtn.on('pointerout', () => backBtn.setColor('#888888'))
    backBtn.on('pointerdown', () => this.scene.start('StartScene'))

    // Row labels
    this.add.text(20, 110, 'HEROES', {
      fontFamily: 'monospace', fontSize: '13px', color: '#aaffaa', stroke: '#000000', strokeThickness: 2,
    }).setDepth(20)
    this.add.text(20, 310, 'ENEMIES', {
      fontFamily: 'monospace', fontSize: '13px', color: '#ffaaaa', stroke: '#000000', strokeThickness: 2,
    }).setDepth(20)
    this.add.text(20, 500, 'OBJECTS', {
      fontFamily: 'monospace', fontSize: '13px', color: '#aaaaff', stroke: '#000000', strokeThickness: 2,
    }).setDepth(20)

    // Create animations
    Orc1.createAnimations(this)
    Orc2.createAnimations(this)
    Player.createAnimations(this)

    // -----------------------------------------------------------------------
    // ROW 1: Heroes (y=150)
    // -----------------------------------------------------------------------
    const heroTypes: HeroType[] = ['ignara', 'sifra', 'nazar', 'amun', 'huntress', 'khashin', 'muller']
    const heroNames = ['Ignara', 'Sifra', 'Nazar', 'Amun', 'Lyra', 'Khashin', 'Muller']

    const totalHeroes = heroTypes.length
    const heroSpacing = 150
    const heroStartX = width / 2 - ((totalHeroes - 1) * heroSpacing) / 2
    const heroBottomY = 230 // align all hitbox bottoms to this Y

    heroTypes.forEach((type, i) => {
      const x = heroStartX + i * heroSpacing

      // Place at temporary Y, then adjust to align hitbox bottoms
      const player = new Player(this, x, 0, type)
      player.setImmovable(true)
      const body = player.body as Phaser.Physics.Arcade.Body
      body.setVelocity(0, 0)
      body.setAllowGravity(false)

      // hitbox bottom = player.y - displayHeight/2 + (bodyOffset.y + body.height)  (in world px)
      // solve for player.y so that hitbox bottom = heroBottomY
      const adjustedY = heroBottomY + (player.displayHeight / 2) - (body.offset.y + body.height) * player.scaleY
      player.setY(adjustedY)
      body.updateFromGameObject()

      const bw = body.width, bh = body.height
      this.add.text(x, heroBottomY + 10, `${heroNames[i]}\n${Math.round(bw)}×${Math.round(bh)}`, {
        fontFamily: 'monospace', fontSize: '11px', color: '#ffffff',
        stroke: '#000000', strokeThickness: 2, align: 'center',
      }).setOrigin(0.5, 0).setDepth(20)
    })

    // -----------------------------------------------------------------------
    // ROW 2: Enemies (y=350)
    // -----------------------------------------------------------------------
    // Enemies row

    // Dummy player far offscreen so enemies don't chase anyone visible
    const dummyPlayer = new Player(this, -9999, -9999, 'ignara')
    dummyPlayer.setVisible(false)
    ;(dummyPlayer.body as Phaser.Physics.Arcade.Body).setEnable(false)

    const enemyDefs = [
      {
        name: 'Orc2',
        bodyW: 24, bodyH: 24,
        create: (x: number, y: number) => new Orc2(this, x, y, dummyPlayer, 1),
      },
      {
        name: 'Orc1',
        bodyW: 24, bodyH: 24,
        create: (x: number, y: number) => new Orc1(this, x, y, dummyPlayer, 1),
      },
      {
        name: 'FlyingEye',
        bodyW: 32, bodyH: 32,
        create: (x: number, y: number) => new FlyingEye(this, x, y, dummyPlayer, 1),
      },
      {
        name: 'SandGolem',
        bodyW: 32, bodyH: 40,
        create: (x: number, y: number) => new SandGolem(this, x, y, dummyPlayer, 1),
      },
    ]

    const totalEnemies = enemyDefs.length
    const enemySpacing = 200
    const enemyStartX = width / 2 - ((totalEnemies - 1) * enemySpacing) / 2
    const enemyBottomY = 430

    enemyDefs.forEach((def, i) => {
      const x = enemyStartX + i * enemySpacing
      const enemy = def.create(x, 0)
      const body = enemy.body as Phaser.Physics.Arcade.Body
      body.setVelocity(0, 0)
      body.setAllowGravity(false)

      const adjustedY = enemyBottomY + (enemy.displayHeight / 2) - (body.offset.y + body.height) * enemy.scaleY
      enemy.setY(adjustedY)
      body.updateFromGameObject()

      const bw = body.width, bh = body.height
      this.add.text(x, enemyBottomY + 10, `${def.name}\n${Math.round(bw)}×${Math.round(bh)}`, {
        fontFamily: 'monospace', fontSize: '11px', color: '#ffffff',
        stroke: '#000000', strokeThickness: 2, align: 'center',
      }).setOrigin(0.5, 0).setDepth(20)
    })

    // -----------------------------------------------------------------------
    // ROW 3: Rocks (static physics) + Trees (images) (y=550)
    // -----------------------------------------------------------------------
    const objectRow = 560

    const rockKeys = ['rock1_1', 'rock1_2', 'rock2_1', 'rock2_2', 'rock3_1', 'rock3_2']
    const treeKeys = ['deco_tree1', 'deco_tree2', 'deco_tree3']
    const allObjKeys = [...rockKeys, ...treeKeys]

    const totalObjs = allObjKeys.length
    const objSpacing = 110
    const objStartX = width / 2 - ((totalObjs - 1) * objSpacing) / 2

    // Static physics group for rocks
    const rocksGroup = this.physics.add.staticGroup()

    allObjKeys.forEach((key, i) => {
      const x = objStartX + i * objSpacing
      const isRock = rockKeys.includes(key)

      if (isRock) {
        const rock = rocksGroup.create(x, objectRow, key) as Phaser.Physics.Arcade.Sprite
        rock.setDepth(5).setScale(0.9)
        rock.refreshBody()
        const body = rock.body as Phaser.Physics.Arcade.StaticBody
        const dw = rock.displayWidth
        const dh = rock.displayHeight
        const scale = rock.scaleX
        body.setSize(dw * 0.45, dh * 0.4)
        body.setOffset((rock.width - dw * 0.45 / scale) / 2, (rock.height - dh * 0.4 / scale) / 2)
      } else {
        // Trees are decorative — no physics
        this.add.image(x, objectRow, key).setDepth(5).setScale(0.7)
      }

      this.add.text(x, objectRow + 55, key, {
        fontFamily: 'monospace', fontSize: '10px', color: '#ccccff',
        stroke: '#000000', strokeThickness: 2, align: 'center',
      }).setOrigin(0.5, 0).setDepth(20)
    })

    // -----------------------------------------------------------------------
    // ROW 4: Boss (y=700)
    // -----------------------------------------------------------------------
    this.add.text(20, 640, 'BOSS', {
      fontFamily: 'monospace', fontSize: '13px', color: '#ff4444', stroke: '#000000', strokeThickness: 2,
    }).setDepth(20)

    // Create boss animations
    const bossAnims: { key: string; start: number; end: number; rate: number; repeat: number }[] = [
      { key: 'boss_idle', start: 0, end: 5, rate: 8, repeat: -1 },
      { key: 'boss_walk', start: 22, end: 33, rate: 10, repeat: -1 },
      { key: 'boss_cleave', start: 44, end: 58, rate: 12, repeat: -1 },
    ]
    bossAnims.forEach((a) => {
      if (!this.anims.exists(a.key)) {
        this.anims.create({
          key: a.key,
          frames: this.anims.generateFrameNumbers('boss_demon', { start: a.start, end: a.end }),
          frameRate: a.rate,
          repeat: a.repeat,
        })
      }
    })

    const bossLabels = ['IDLE', 'WALK', 'CLEAVE']
    const bossSpacing = 200
    const bossStartX = width / 2 - ((bossAnims.length - 1) * bossSpacing) / 2
    const bossRowY = 720

    bossAnims.forEach((a, i) => {
      const x = bossStartX + i * bossSpacing
      const sprite = this.add.sprite(x, bossRowY, 'boss_demon').setScale(2).setDepth(10)
      sprite.play(a.key)
      this.add.text(x, bossRowY + 80, bossLabels[i], {
        fontFamily: 'monospace', fontSize: '11px', color: '#ff8888',
        stroke: '#000000', strokeThickness: 2, align: 'center',
      }).setOrigin(0.5, 0).setDepth(20)
    })

    // Section dividers
    const gfx = this.add.graphics().setDepth(1)
    gfx.lineStyle(1, 0x333333, 0.8)
    gfx.lineBetween(0, 255, width, 255)
    gfx.lineBetween(0, 450, width, 450)
    gfx.lineBetween(0, 635, width, 635)

    // Boss Test button
    const bossBtn = this.add.text(width - 16, 16, 'BOSS TEST >', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 3,
      backgroundColor: '#1a1a2e',
      padding: { x: 10, y: 6 },
    }).setOrigin(1, 0).setDepth(20).setInteractive({ useHandCursor: true })
    bossBtn.on('pointerover', () => bossBtn.setColor('#FFD700'))
    bossBtn.on('pointerout', () => bossBtn.setColor('#ff4444'))
    bossBtn.on('pointerdown', () => this.scene.start('BossTestScene'))
  }
}
