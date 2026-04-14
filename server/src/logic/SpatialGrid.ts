/**
 * Simple 2D spatial hash grid for fast proximity queries.
 * Used to avoid O(n²) enemy-player collision checks.
 */
export class SpatialGrid {
  private cells = new Map<number, Set<string>>()
  private readonly cellSize: number

  constructor(cellSize = 120) {
    this.cellSize = cellSize
  }

  private key(cx: number, cy: number): number {
    return cx * 10000 + cy
  }

  clear() { this.cells.clear() }

  insert(id: string, x: number, y: number) {
    const cx = Math.floor(x / this.cellSize)
    const cy = Math.floor(y / this.cellSize)
    const k = this.key(cx, cy)
    let cell = this.cells.get(k)
    if (!cell) { cell = new Set(); this.cells.set(k, cell) }
    cell.add(id)
  }

  query(x: number, y: number, radius: number): string[] {
    const results: string[] = []
    const minCx = Math.floor((x - radius) / this.cellSize)
    const maxCx = Math.floor((x + radius) / this.cellSize)
    const minCy = Math.floor((y - radius) / this.cellSize)
    const maxCy = Math.floor((y + radius) / this.cellSize)
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const cell = this.cells.get(this.key(cx, cy))
        if (cell) for (const id of cell) results.push(id)
      }
    }
    return results
  }
}
