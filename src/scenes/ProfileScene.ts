import Phaser from 'phaser'
import { MetaProgress } from '../systems/MetaProgress'
import { gameFont } from '../utils/device'

const CAT_COLORS: Record<string, number> = {
  kills: 0xff4444,
  survival: 0x44cc44,
  hero: 0xffaa22,
  progression: 0x44aaff,
  wave: 0xdddd44,
  secret: 0xcc55ff,
}

export class ProfileScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ProfileScene' })
  }

  create() {
    this.cameras.main.fadeIn(200)
    const { width, height } = this.scale
    const isPortrait = height > width
    const meta = MetaProgress.load()
    const defs = MetaProgress.getAchievementDefs()
    const { unlocked, total } = MetaProgress.getUnlockedCount()

    // Background
    const bg = this.add.graphics()
    bg.fillStyle(0x0a0a14)
    bg.fillRect(0, 0, width, height)

    // Header
    const profileTitleTxt = this.add.text(width / 2, 30, 'CLAWS PROFILE', {
      fontFamily: gameFont(), fontSize: '28px',
      color: '#FFD700',
    }).setOrigin(0.5)
    profileTitleTxt.setShadow(0, 1, '#000000', 2, true, true)

    // Back button
    const back = this.add.text(20, 20, '< BACK', {
      fontFamily: gameFont(), fontSize: '16px',
      color: '#888888',
    }).setInteractive({ useHandCursor: true })
    back.on('pointerover', () => back.setColor('#ffffff'))
    back.on('pointerout', () => back.setColor('#888888'))
    back.on('pointerdown', () => { this.cameras.main.fadeOut(200); this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('StartScene')) })

    // ESC to go back
    this.input.keyboard!.on('keydown-ESC', () => { this.cameras.main.fadeOut(200); this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('StartScene')) })

    // === STATS PANEL ===
    const panelX = 20
    const panelW = width - 40
    let y = 70

    this.drawPanel(panelX, y, panelW, 90, 'LIFETIME STATS')

    const statCol1 = panelX + 20
    // In portrait, the panel is ~350px wide — keep col2 and its values within the right half
    const statCol2 = isPortrait ? panelX + Math.floor(panelW / 2) + 10 : panelX + panelW / 2 + 20
    const valOffset = isPortrait ? 90 : 120
    const statY = y + 30

    const statFontSize = isPortrait ? '14px' : '13px'
    const statStyle = { fontFamily: gameFont(), fontSize: statFontSize, color: '#cccccc' }
    const valStyle = { fontFamily: gameFont(), fontSize: statFontSize, color: '#ffffff' }

    this.add.text(statCol1, statY, 'Total Kills:', statStyle)
    this.add.text(statCol1 + valOffset, statY, meta.totalKills.toLocaleString(), valStyle)
    this.add.text(statCol2, statY, 'Best Kills:', statStyle)
    this.add.text(statCol2 + valOffset, statY, meta.bestKills.toLocaleString(), valStyle)

    this.add.text(statCol1, statY + 20, 'Total Runs:', statStyle)
    this.add.text(statCol1 + valOffset, statY + 20, `${meta.totalRuns}`, valStyle)
    this.add.text(statCol2, statY + 20, 'Wins:', statStyle)
    this.add.text(statCol2 + valOffset, statY + 20, `${meta.totalWins}`, valStyle)

    this.add.text(statCol1, statY + 40, 'Time Played:', statStyle)
    this.add.text(statCol1 + valOffset, statY + 40, this.formatDuration(meta.totalTimeMs), valStyle)
    this.add.text(statCol2, statY + 40, 'Best Time:', statStyle)
    this.add.text(statCol2 + valOffset, statY + 40, this.formatTime(meta.bestTime), valStyle)

    y += 100

    // === HERO STATS ===
    const heroList = [
      { key: 'ignara',   name: 'Ignara',  color: '#ff6644' },
      { key: 'sifra',    name: 'Sifra',   color: '#66bbff' },
      { key: 'amun',     name: 'Amun',    color: '#ffdd44' },
      { key: 'nazar',    name: 'Nazar',   color: '#cc4422' },
      { key: 'huntress', name: 'Lyra',    color: '#55aa55' },
      { key: 'khashin',  name: 'Khashin', color: '#ccaa55' },
      { key: 'muller',   name: 'Givi',    color: '#55aacc' },
    ]
    const heroH = 28 + heroList.length * 20 + 8
    this.drawPanel(panelX, y, panelW, heroH, 'HERO STATS')

    const hdrY = y + 26
    const hdrStyle = { fontFamily: gameFont(), fontSize: '10px', color: '#666666' } as Phaser.Types.GameObjects.Text.TextStyle
    this.add.text(panelX + 20, hdrY, 'HERO', hdrStyle)
    this.add.text(panelX + 100, hdrY, 'RUNS', hdrStyle)
    this.add.text(panelX + 145, hdrY, 'WINS', hdrStyle)
    this.add.text(panelX + 190, hdrY, 'WIN%', hdrStyle)
    this.add.text(panelX + 235, hdrY, 'BEST K', hdrStyle)
    this.add.text(panelX + 290, hdrY, 'BEST T', hdrStyle)

    for (let hi = 0; hi < heroList.length; hi++) {
      const h = heroList[hi]
      const hy = hdrY + 16 + hi * 20
      const runs = meta.heroRuns[h.key] || 0
      const wins = meta.heroWins[h.key] || 0
      const winPct = runs > 0 ? Math.round((wins / runs) * 100) : 0
      const heroSessions = meta.sessions.filter(s => s.hero === h.key)
      const bestK = heroSessions.length > 0 ? Math.max(...heroSessions.map(s => s.kills)) : 0
      const bestT = heroSessions.length > 0 ? Math.max(...heroSessions.map(s => s.timeMs)) : 0

      this.add.text(panelX + 20, hy, h.name, {
        fontFamily: gameFont(), fontSize: '12px', color: h.color,
      })
      const rs = { fontFamily: gameFont(), fontSize: '12px', color: '#bbbbbb' } as Phaser.Types.GameObjects.Text.TextStyle
      this.add.text(panelX + 100, hy, `${runs}`, rs)
      this.add.text(panelX + 145, hy, `${wins}`, rs)
      this.add.text(panelX + 190, hy, `${winPct}%`, { ...rs, color: winPct >= 50 ? '#88ff88' : '#bbbbbb' })
      this.add.text(panelX + 235, hy, `${bestK}`, rs)
      this.add.text(panelX + 290, hy, bestK > 0 ? this.formatTime(bestT) : '-', rs)
    }

    y += heroH + 10

    // === ACHIEVEMENTS ===
    const achH = Math.min(height - y - 160, 280)
    this.drawPanel(panelX, y, panelW, achH, `ACHIEVEMENTS (${unlocked}/${total})`)

    const achStartY = y + 28
    const achColW = Math.floor((panelW - 40) / 2)
    let achIdx = 0

    for (const def of defs) {
      const state = meta.achievements.find(a => a.id === def.id)
      const isUnlocked = state?.unlocked ?? false
      const col = achIdx % 2
      const row = Math.floor(achIdx / 2)
      const ax = panelX + 20 + col * achColW
      const ay = achStartY + row * 22

      if (ay > y + achH - 10) break // overflow guard

      const catColor = CAT_COLORS[def.category] || 0xaaaaaa
      // Category dot
      const g = this.add.graphics()
      g.fillStyle(isUnlocked ? catColor : 0x333333)
      g.fillCircle(ax + 6, ay + 6, 4)

      // Checkmark or lock
      const mark = isUnlocked ? 'V' : 'x'
      const markColor = isUnlocked ? '#88ff88' : '#444444'
      this.add.text(ax + 14, ay, mark, {
        fontFamily: gameFont(), fontSize: '11px', color: markColor,
      })

      // Name
      this.add.text(ax + 26, ay, def.name, {
        fontFamily: gameFont(), fontSize: '11px',
        color: isUnlocked ? '#dddddd' : '#555555',
      })

      achIdx++
    }

    y += achH + 10

    // === RECENT SESSIONS ===
    const sessH = Math.min(height - y - 10, 160)
    if (sessH > 60) {
      this.drawPanel(panelX, y, panelW, sessH, 'RECENT SESSIONS')

      const sessY = y + 28
      const headerStyle = { fontFamily: gameFont(), fontSize: '10px', color: '#666666' }
      this.add.text(panelX + 20, sessY, '#', headerStyle)
      this.add.text(panelX + 45, sessY, 'HERO', headerStyle)
      this.add.text(panelX + 120, sessY, 'KILLS', headerStyle)
      this.add.text(panelX + 175, sessY, 'LVL', headerStyle)
      this.add.text(panelX + 215, sessY, 'TIME', headerStyle)
      this.add.text(panelX + 275, sessY, 'W/L', headerStyle)

      const rowStyle = { fontFamily: gameFont(), fontSize: '11px', color: '#bbbbbb' }

      for (let i = 0; i < Math.min(meta.sessions.length, 6); i++) {
        const s = meta.sessions[i]
        const ry = sessY + 16 + i * 18
        if (ry > y + sessH - 10) break

        const heroColors: Record<string, string> = {
          ignara: '#ff6644', nazar: '#cc4422', sifra: '#66bbff', amun: '#ffdd44',
          huntress: '#55aa55', khashin: '#ccaa55', muller: '#55aacc',
        }

        this.add.text(panelX + 20, ry, `${s.id}`, rowStyle)
        this.add.text(panelX + 45, ry, s.hero.charAt(0).toUpperCase() + s.hero.slice(1), {
          ...rowStyle, color: heroColors[s.hero] || '#bbbbbb',
        })
        this.add.text(panelX + 120, ry, `${s.kills}`, rowStyle)
        this.add.text(panelX + 175, ry, `${s.level}`, rowStyle)
        this.add.text(panelX + 215, ry, this.formatTime(s.timeMs), rowStyle)
        this.add.text(panelX + 275, ry, s.won ? 'W' : 'L', {
          ...rowStyle, color: s.won ? '#88ff88' : '#ff6666',
        })
      }
    }
  }

  private drawPanel(x: number, y: number, w: number, h: number, title: string) {
    const g = this.add.graphics()
    g.fillStyle(0x14141e)
    g.fillRoundedRect(x, y, w, h, 6)
    g.lineStyle(1, 0x333344)
    g.strokeRoundedRect(x, y, w, h, 6)

    this.add.text(x + 12, y + 6, title, {
      fontFamily: gameFont(), fontSize: '12px',
      color: '#FFD700',
    })
  }

  private formatTime(ms: number): string {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    return `${m}:${String(s % 60).padStart(2, '0')}`
  }

  private formatDuration(ms: number): string {
    const totalMin = Math.floor(ms / 60000)
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }
}
