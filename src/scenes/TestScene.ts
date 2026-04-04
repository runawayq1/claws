import Phaser from 'phaser'
import { Player, type HeroType } from '../entities/Player'
import { Skeleton } from '../entities/Skeleton'
import { Goblin } from '../entities/Zergling'
import { FlyingEye } from '../entities/Scorpion'
import { SandGolem } from '../entities/SandGolem'

export class TestScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TestScene' })
  }

  preload() {
    // Monster enemy spritesheets (150x150 frames, side-view)
    this.load.spritesheet('skeleton_attack', 'assets/skeleton/Attack3.png', { frameWidth: 150, frameHeight: 150 })
    this.load.spritesheet('goblin_attack', 'assets/goblin/Attack3.png', { frameWidth: 150, frameHeight: 150 })
    this.load.spritesheet('mushroom_attack', 'assets/mushroom/Attack3.png', { frameWidth: 150, frameHeight: 150 })
    this.load.spritesheet('flyingeye_attack', 'assets/flying_eye/Attack3.png', { frameWidth: 150, frameHeight: 150 })

    // Ignara hero — Evil Wizard 1 (150x150 frames)
    this.load.spritesheet('ignara_idle', 'assets/fire_wizard/Idle.png', { frameWidth: 150, frameHeight: 150 })
    this.load.spritesheet('ignara_run', 'assets/fire_wizard/Move.png', { frameWidth: 150, frameHeight: 150 })
    this.load.spritesheet('ignara_attack', 'assets/fire_wizard/Attack.png', { frameWidth: 150, frameHeight: 150 })
    this.load.spritesheet('ignara_hurt', 'assets/fire_wizard/Take Hit.png', { frameWidth: 150, frameHeight: 150 })
    this.load.spritesheet('ignara_death', 'assets/fire_wizard/Death.png', { frameWidth: 150, frameHeight: 150 })

    // Sifra hero — Wizard Pack (231x190 frames)
    this.load.spritesheet('sifra_idle', 'assets/wizard/Idle.png', { frameWidth: 231, frameHeight: 190 })
    this.load.spritesheet('sifra_run', 'assets/wizard/Run.png', { frameWidth: 231, frameHeight: 190 })
    this.load.spritesheet('sifra_attack', 'assets/wizard/Attack1.png', { frameWidth: 231, frameHeight: 190 })
    this.load.spritesheet('sifra_hurt', 'assets/wizard/Hit.png', { frameWidth: 231, frameHeight: 190 })
    this.load.spritesheet('sifra_death', 'assets/wizard/Death.png', { frameWidth: 231, frameHeight: 190 })

    // Nazar hero — Martial Hero (200x200 frames)
    this.load.spritesheet('nazar_idle', 'assets/martial_hero/Idle.png', { frameWidth: 200, frameHeight: 200 })
    this.load.spritesheet('nazar_run', 'assets/martial_hero/Run.png', { frameWidth: 200, frameHeight: 200 })
    this.load.spritesheet('nazar_attack', 'assets/martial_hero/Attack1.png', { frameWidth: 200, frameHeight: 200 })
    this.load.spritesheet('nazar_hurt', 'assets/martial_hero/Take Hit.png', { frameWidth: 200, frameHeight: 200 })
    this.load.spritesheet('nazar_death', 'assets/martial_hero/Death.png', { frameWidth: 200, frameHeight: 200 })

    // Amun hero — Medieval King (160x111 frames)
    this.load.spritesheet('amun_idle', 'assets/king/Idle.png', { frameWidth: 160, frameHeight: 111 })
    this.load.spritesheet('amun_run', 'assets/king/Run.png', { frameWidth: 160, frameHeight: 111 })
    this.load.spritesheet('amun_attack', 'assets/king/Attack1.png', { frameWidth: 160, frameHeight: 111 })
    this.load.spritesheet('amun_hurt', 'assets/king/Take Hit.png', { frameWidth: 160, frameHeight: 111 })
    this.load.spritesheet('amun_death', 'assets/king/Death.png', { frameWidth: 160, frameHeight: 111 })

    // Huntress hero (150x150 frames)
    this.load.spritesheet('huntress_idle', 'assets/huntress/Idle.png', { frameWidth: 150, frameHeight: 150 })
    this.load.spritesheet('huntress_run', 'assets/huntress/Run.png', { frameWidth: 150, frameHeight: 150 })
    this.load.spritesheet('huntress_attack', 'assets/huntress/Attack1.png', { frameWidth: 150, frameHeight: 150 })
    this.load.spritesheet('huntress_attack2', 'assets/huntress/Attack2.png', { frameWidth: 150, frameHeight: 150 })
    this.load.spritesheet('huntress_ranged', 'assets/huntress/Attack3.png', { frameWidth: 150, frameHeight: 150 })
    this.load.spritesheet('huntress_hurt', 'assets/huntress/Take hit.png', { frameWidth: 150, frameHeight: 150 })
    this.load.spritesheet('huntress_death', 'assets/huntress/Death.png', { frameWidth: 150, frameHeight: 150 })

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
    Skeleton.createAnimations(this)
    Goblin.createAnimations(this)
    Player.createAnimations(this)

    // -----------------------------------------------------------------------
    // ROW 1: Heroes (y=150)
    // -----------------------------------------------------------------------
    const heroTypes: HeroType[] = ['ignara', 'sifra', 'nazar', 'amun']
    const heroNames = ['Ignara', 'Sifra', 'Nazar', 'Amun']

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
        name: 'Skeleton',
        bodyW: 30, bodyH: 38,
        create: (x: number, y: number) => new Skeleton(this, x, y, dummyPlayer, 1),
      },
      {
        name: 'Goblin',
        bodyW: 28, bodyH: 36,
        create: (x: number, y: number) => new Goblin(this, x, y, dummyPlayer, 1),
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

    // Section dividers
    const gfx = this.add.graphics().setDepth(1)
    gfx.lineStyle(1, 0x333333, 0.8)
    gfx.lineBetween(0, 255, width, 255)
    gfx.lineBetween(0, 450, width, 450)
  }
}
