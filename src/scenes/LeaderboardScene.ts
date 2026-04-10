import Phaser from 'phaser'
import { supabase } from '../systems/SupabaseClient'

type TabKey = 'kills' | 'time' | 'wins'

interface LeaderboardRow {
  player_name: string
  hero: string
  kills: number
  level: number
  time_ms: number
  wave: number
  won: boolean
  date: string
}

const C = {
  BG: 0x0a0a1e,
  PANEL: 0x14141e,
  BORDER: 0x333344,
  BORDER_GOLD: 0xaa8833,
  GOLD: '#FFD700',
  MUTED: '#888888',
  LABEL: '#ccddee',
  DIM: '#555566',
  WIN: '#88ff88',
  LOSE: '#ff6666',
  LOCAL_TINT: '#ffe08a',
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'kills', label: 'Top Kills' },
  { key: 'time',  label: 'Longest Run' },
  { key: 'wins',  label: 'Recent Wins' },
]

export class LeaderboardScene extends Phaser.Scene {
  private activeTab: TabKey = 'kills'
  private _tabCache: Partial<Record<TabKey, LeaderboardRow[]>> = {}
  private contentGroup: Phaser.GameObjects.GameObject[] = []
  private tabBtns: { key: TabKey; bg: Phaser.GameObjects.Graphics; txt: Phaser.GameObjects.Text; x: number }[] = []
  private localPlayer: string = ''

  constructor() { super({ key: 'LeaderboardScene' }) }

  create() {
    this.cameras.main.fadeIn(200)
    this.localPlayer = localStorage.getItem('claws_player_name') ?? ''
    const { width, height } = this.scale
    const compact = height < 500
    const isPortrait = height > width

    // Background
    const bg = this.add.graphics()
    bg.fillStyle(C.BG)
    bg.fillRect(0, 0, width, height)

    // Title
    const titleFontSize = compact ? '24px' : isPortrait ? '28px' : '36px'
    const titleY = compact ? 22 : 30
    this.add.text(width / 2, titleY, 'LEADERBOARD', {
      fontFamily: 'monospace',
      fontSize: titleFontSize,
      color: C.GOLD,
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5)

    // Back button
    const backFontSize = compact ? '12px' : '14px'
    const back = this.add.text(16, compact ? 12 : 16, '< BACK', {
      fontFamily: 'monospace',
      fontSize: backFontSize,
      color: C.MUTED,
      stroke: '#000000',
      strokeThickness: 2,
    }).setInteractive({ useHandCursor: true })
    back.on('pointerover', () => back.setColor('#ffffff'))
    back.on('pointerout', () => back.setColor(C.MUTED))
    back.on('pointerdown', () => this.goBack())

    // ESC to go back
    this.input.keyboard!.on('keydown-ESC', () => this.goBack())

    // Tabs
    const tabAreaY = titleY + (compact ? 30 : 46)
    this.buildTabs(tabAreaY, compact, isPortrait)

    // Load initial tab
    const tableY = tabAreaY + (compact ? 32 : 42)
    this.fetchAndRender(tableY, compact, isPortrait)
  }

  private goBack() {
    this.cameras.main.fadeOut(200)
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('StartScene'))
  }

  private buildTabs(y: number, compact: boolean, isPortrait: boolean) {
    const { width } = this.scale
    const tabW = compact ? 90 : isPortrait ? 110 : 130
    const tabH = compact ? 24 : 30
    const gap = 8
    const totalW = TABS.length * tabW + (TABS.length - 1) * gap
    const startX = (width - totalW) / 2
    const fontSize = compact ? '11px' : '13px'

    this.tabBtns = []

    for (let i = 0; i < TABS.length; i++) {
      const t = TABS[i]
      const tx = startX + i * (tabW + gap)

      const tabBg = this.add.graphics()
      this.renderTabBg(tabBg, tx, y, tabW, tabH, t.key === this.activeTab)

      const tabTxt = this.add.text(tx + tabW / 2, y + tabH / 2, t.label, {
        fontFamily: 'monospace',
        fontSize,
        color: t.key === this.activeTab ? C.GOLD : C.MUTED,
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5)

      const zone = this.add.zone(tx, y, tabW, tabH).setOrigin(0).setInteractive({ useHandCursor: true })
      zone.on('pointerover', () => {
        if (t.key !== this.activeTab) tabTxt.setColor('#cccccc')
      })
      zone.on('pointerout', () => {
        if (t.key !== this.activeTab) tabTxt.setColor(C.MUTED)
      })
      zone.on('pointerdown', () => {
        if (t.key === this.activeTab) return
        this.activeTab = t.key
        // Update all tab appearances
        for (const btn of this.tabBtns) {
          const isActive = btn.key === this.activeTab
          this.renderTabBg(btn.bg, btn.x, y, tabW, tabH, isActive)
          btn.txt.setColor(isActive ? C.GOLD : C.MUTED)
        }
        // Refetch (or use _tabCache)
        const { height } = this.scale
        const compact2 = height < 500
        const isPortrait2 = height > width
        const tabAreaY2 = y
        const tableY = tabAreaY2 + (compact2 ? 32 : 42)
        this.fetchAndRender(tableY, compact2, isPortrait2)
      })

      this.tabBtns.push({ key: t.key, bg: tabBg, txt: tabTxt, x: tx })
    }
  }

  private renderTabBg(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, active: boolean) {
    g.clear()
    g.fillStyle(active ? 0x1a1a2e : 0x111120)
    g.fillRoundedRect(x, y, w, h, 4)
    g.lineStyle(1, active ? C.BORDER_GOLD : C.BORDER)
    g.strokeRoundedRect(x, y, w, h, 4)
  }

  private clearContent() {
    for (const obj of this.contentGroup) obj.destroy()
    this.contentGroup = []
  }

  private async fetchAndRender(tableY: number, compact: boolean, isPortrait: boolean) {
    this.clearContent()
    this.showMessage(tableY, 'Loading...', C.MUTED, compact)

    if (this._tabCache[this.activeTab]) {
      this.clearContent()
      this.renderTable(this._tabCache[this.activeTab]!, tableY, compact, isPortrait)
      return
    }

    let query = supabase
      .from('sessions')
      .select('player_name, hero, kills, level, time_ms, wave, won, date')

    if (this.activeTab === 'kills') {
      query = query.order('kills', { ascending: false })
    } else if (this.activeTab === 'time') {
      query = query.order('time_ms', { ascending: false })
    } else {
      query = query.eq('won', true).order('date', { ascending: false })
    }

    const { data, error } = await query.limit(25)

    // Guard: tab may have changed while awaiting
    const tabAtFetch = this.activeTab

    if (!this.scene.isActive()) return

    if (error) {
      console.error('[LeaderboardScene] fetch error:', error)
      this.clearContent()
      this.showMessage(tableY, 'Could not load leaderboard.', '#ff6666', compact)
      return
    }

    const rows = (data ?? []) as LeaderboardRow[]
    this._tabCache[tabAtFetch] = rows

    // Only render if still on the same tab
    if (this.activeTab !== tabAtFetch) return

    this.clearContent()
    this.renderTable(rows, tableY, compact, isPortrait)
  }

  private showMessage(y: number, msg: string, color: string, compact: boolean) {
    const { width, height } = this.scale
    const t = this.add.text(width / 2, (y + height) / 2, msg, {
      fontFamily: 'monospace',
      fontSize: compact ? '14px' : '18px',
      color,
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5)
    this.contentGroup.push(t)
  }

  private renderTable(rows: LeaderboardRow[], tableY: number, compact: boolean, isPortrait: boolean) {
    const { width, height } = this.scale

    if (rows.length === 0) {
      this.showMessage(tableY, 'No runs recorded yet — be the first.', C.MUTED, compact)
      return
    }

    const panelX = isPortrait ? 8 : 20
    const panelW = width - panelX * 2
    const rowH = compact ? 20 : 24
    const panelH = Math.min(rows.length * rowH + 36, height - tableY - 16)

    // Panel background
    const panelG = this.add.graphics()
    panelG.fillStyle(C.PANEL)
    panelG.fillRoundedRect(panelX, tableY, panelW, panelH, 6)
    panelG.lineStyle(1, C.BORDER)
    panelG.strokeRoundedRect(panelX, tableY, panelW, panelH, 6)
    this.contentGroup.push(panelG)

    // Column layout — adapt for portrait vs landscape and compact
    const pad = isPortrait ? 6 : 12
    const fontSize = compact ? '10px' : isPortrait ? '11px' : '12px'
    const hdrFontSize = compact ? '9px' : '10px'

    // Column X positions (relative to panelX + pad)
    const col = {
      rank:   panelX + pad,
      name:   panelX + pad + (compact ? 24 : 30),
      hero:   panelX + pad + (compact ? 24 : 30) + (isPortrait ? 80 : 100),
      kills:  panelX + panelW - (isPortrait ? 170 : 200) - pad,
      level:  panelX + panelW - (isPortrait ? 125 : 148) - pad,
      time:   panelX + panelW - (isPortrait ? 75 : 90) - pad,
      won:    panelX + panelW - pad,
    }

    // Header
    const hdrY = tableY + 8
    const hdrStyle = { fontFamily: 'monospace', fontSize: hdrFontSize, color: C.DIM } as Phaser.Types.GameObjects.Text.TextStyle

    const hRank = this.add.text(col.rank, hdrY, '#', hdrStyle)
    const hName = this.add.text(col.name, hdrY, 'PLAYER', hdrStyle)
    const hHero = this.add.text(col.hero, hdrY, 'HERO', hdrStyle)
    const hKills = this.add.text(col.kills, hdrY, 'KILLS', hdrStyle)
    const hLevel = this.add.text(col.level, hdrY, 'LVL', hdrStyle)
    const hTime = this.add.text(col.time, hdrY, 'TIME', hdrStyle)
    const hWon = this.add.text(col.won, hdrY, 'W', hdrStyle).setOrigin(1, 0)
    this.contentGroup.push(hRank, hName, hHero, hKills, hLevel, hTime, hWon)

    // Divider line
    const divG = this.add.graphics()
    divG.lineStyle(1, C.BORDER)
    divG.lineBetween(panelX + pad, hdrY + 14, panelX + panelW - pad, hdrY + 14)
    this.contentGroup.push(divG)

    const rowStyle = { fontFamily: 'monospace', fontSize, color: C.LABEL, stroke: '#000000', strokeThickness: 1 } as Phaser.Types.GameObjects.Text.TextStyle

    const maxRows = Math.floor((panelH - 36) / rowH)

    for (let i = 0; i < Math.min(rows.length, maxRows); i++) {
      const row = rows[i]
      const ry = hdrY + 20 + i * rowH
      const isLocal = this.localPlayer && row.player_name === this.localPlayer
      const nameColor = isLocal ? C.LOCAL_TINT : C.LABEL
      const rowColor = isLocal ? C.LOCAL_TINT : C.LABEL

      // Highlight strip for local player
      if (isLocal) {
        const hlG = this.add.graphics()
        hlG.fillStyle(0xaa8800, 0.12)
        hlG.fillRoundedRect(panelX + 2, ry - 2, panelW - 4, rowH, 3)
        this.contentGroup.push(hlG)
      }

      const heroName = row.hero.charAt(0).toUpperCase() + row.hero.slice(1)
      const timeStr = this.formatTime(row.time_ms)
      const maxNameLen = isPortrait ? 9 : 14
      const rawName = row.player_name || '???'
      const displayName = rawName.length > maxNameLen ? rawName.slice(0, maxNameLen) + '…' : rawName

      const tRank  = this.add.text(col.rank,  ry, `${i + 1}`,   { ...rowStyle, color: C.DIM })
      const tName  = this.add.text(col.name,  ry, displayName,  { ...rowStyle, color: nameColor })
      const tHero  = this.add.text(col.hero,  ry, heroName,        { ...rowStyle, color: rowColor })
      const tKills = this.add.text(col.kills, ry, `${row.kills}`,  { ...rowStyle, color: rowColor })
      const tLevel = this.add.text(col.level, ry, `${row.level}`,  { ...rowStyle, color: rowColor })
      const tTime  = this.add.text(col.time,  ry, timeStr,         { ...rowStyle, color: rowColor })
      const tWon   = this.add.text(col.won,   ry, row.won ? 'W' : 'L', {
        ...rowStyle, color: row.won ? C.WIN : C.LOSE,
      }).setOrigin(1, 0)

      this.contentGroup.push(tRank, tName, tHero, tKills, tLevel, tTime, tWon)
    }
  }

  private formatTime(ms: number): string {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    return `${m}:${String(s % 60).padStart(2, '0')}`
  }
}
